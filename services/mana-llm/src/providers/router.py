"""Provider routing with alias resolution and health-aware fallback.

The router is the single entry point that the FastAPI handlers use. Its
job is:

1. Resolve the request's ``model`` field. If it lives in the ``mana/``
   namespace the :class:`AliasRegistry` returns an ordered chain of
   concrete provider/model strings; everything else is treated as a
   single-entry chain (caller passed a direct provider/model).
2. Walk the chain, skipping entries whose provider is either
   unconfigured at this deployment (no API key) or currently marked
   unhealthy in the :class:`ProviderHealthCache`.
3. Try each remaining entry. Connection errors, timeouts, 5xx, and rate
   limits are retryable — record them in the cache and move to the next
   entry. Capability/auth/blocked errors are caller-fixable and
   propagate immediately without touching the health cache.
4. Return the first successful response. If every entry was skipped or
   failed, raise :class:`NoHealthyProviderError` (HTTP 503) carrying
   the full attempt log so debugging is straightforward.

The full design lives in ``docs/plans/llm-fallback-aliases.md``. This is
the M3 milestone.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any, TypeVar

import httpx

from src.aliases import AliasRegistry
from src.config import settings
from src.health import ProviderHealthCache
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
)
from src.utils.metrics import (
    record_alias_resolved,
    record_fallback,
    set_provider_healthy,
)

from .base import LLMProvider
from .errors import (
    NoHealthyProviderError,
    ProviderAuthError,
    ProviderBlockedError,
    ProviderCapabilityError,
    ProviderError,
    ProviderRateLimitError,
)
from .ollama import OllamaProvider
from .openai_compat import OpenAICompatProvider

logger = logging.getLogger(__name__)

T = TypeVar("T")


class ProviderRouter:
    """Health-aware provider router with alias resolution.

    Construct with the AliasRegistry and ProviderHealthCache from
    application startup; both are external dependencies so tests can
    inject mocks without going through global state.
    """

    def __init__(
        self,
        aliases: AliasRegistry,
        health_cache: ProviderHealthCache,
    ) -> None:
        self.aliases = aliases
        self.health_cache = health_cache
        self.providers: dict[str, LLMProvider] = {}
        self._initialize_providers()

    # ------------------------------------------------------------------
    # Provider initialisation
    # ------------------------------------------------------------------

    def _initialize_providers(self) -> None:
        """Spin up provider adapters based on what's configured."""
        # Ollama: always present (talks to a local/proxied server). Whether
        # it's actually reachable is the cache's job to figure out.
        self.providers["ollama"] = OllamaProvider()
        logger.info("Initialized Ollama provider at %s", settings.ollama_url)

        if settings.google_api_key:
            from .google import GoogleProvider

            self.providers["google"] = GoogleProvider(
                api_key=settings.google_api_key,
                default_model=settings.google_default_model,
            )
            logger.info("Initialized Google Gemini provider")

        if settings.openrouter_api_key:
            self.providers["openrouter"] = OpenAICompatProvider(
                name="openrouter",
                base_url=settings.openrouter_base_url,
                api_key=settings.openrouter_api_key,
                default_model=settings.openrouter_default_model,
            )
            logger.info("Initialized OpenRouter provider")

        if settings.groq_api_key:
            self.providers["groq"] = OpenAICompatProvider(
                name="groq",
                base_url=settings.groq_base_url,
                api_key=settings.groq_api_key,
            )
            logger.info("Initialized Groq provider")

        if settings.together_api_key:
            self.providers["together"] = OpenAICompatProvider(
                name="together",
                base_url=settings.together_base_url,
                api_key=settings.together_api_key,
            )
            logger.info("Initialized Together provider")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _parse_model(self, model: str) -> tuple[str, str]:
        """Split ``provider/model`` into its parts.

        Bare names (no prefix) default to Ollama for compatibility with
        plain OpenAI-style requests. Aliases (``mana/...``) are resolved
        before this is ever called.
        """
        if "/" in model:
            provider, _, model_name = model.partition("/")
            return provider.lower(), model_name
        return "ollama", model

    def _resolve_chain(self, model_or_alias: str) -> list[str]:
        """Expand aliases to chains; pass everything else through unchanged."""
        if AliasRegistry.is_alias(model_or_alias):
            return list(self.aliases.resolve_chain(model_or_alias))
        return [model_or_alias]

    @staticmethod
    def _is_retryable(exc: BaseException) -> bool:
        """Should we treat this exception as "try the next chain entry"?

        ConnectError / timeouts / 5xx / rate-limits = yes (provider blip).
        Auth / capability / blocked / 4xx = no (caller has to fix
        something; retrying with a different provider only hides the bug).
        """
        if isinstance(exc, ProviderCapabilityError):
            return False
        if isinstance(exc, ProviderBlockedError):
            return False
        if isinstance(exc, ProviderAuthError):
            return False
        if isinstance(exc, ProviderRateLimitError):
            return True
        if isinstance(
            exc,
            (
                httpx.ConnectError,
                httpx.ConnectTimeout,
                httpx.ReadError,
                httpx.ReadTimeout,
                httpx.RemoteProtocolError,
                httpx.WriteError,
                httpx.WriteTimeout,
                httpx.PoolTimeout,
            ),
        ):
            return True
        if isinstance(exc, httpx.HTTPStatusError):
            return exc.response.status_code >= 500
        if isinstance(exc, ProviderError):
            # Any other provider-side error — treat as retryable.
            # Subclasses with explicit non-retry semantics are caught above.
            return True
        # Unknown exception types: do NOT silently retry. Better to
        # surface a strange error than hide a real bug behind a fallback.
        return False

    @staticmethod
    def _exception_summary(exc: BaseException) -> str:
        """Compact one-liner for cache.last_error and log entries."""
        return f"{type(exc).__name__}: {exc}"

    def _check_tool_capability(
        self,
        provider: LLMProvider,
        model_name: str,
        request: ChatCompletionRequest,
    ) -> None:
        """Refuse tool-bearing requests for models that don't support tools.

        Silent downgrade (dropping the ``tools`` payload) is more dangerous
        than an explicit error — the caller would get plain text back and
        have no way to tell the tools never reached the model.
        """
        if not request.tools:
            return
        if not provider.model_supports_tools(model_name):
            raise ProviderCapabilityError(
                f"{provider.name}/{model_name} does not support tool calling. "
                "Choose a tool-capable model (e.g. groq/llama-3.3-70b-versatile)"
            )

    # ------------------------------------------------------------------
    # Core fallback executor (non-streaming)
    # ------------------------------------------------------------------

    async def _execute_with_fallback(
        self,
        model_or_alias: str,
        request: ChatCompletionRequest,
        call: Callable[[LLMProvider, str, ChatCompletionRequest], Awaitable[T]],
    ) -> T:
        """Walk the resolved chain, returning the first successful result.

        ``call`` is the operation to run against each chain entry, e.g.
        ``lambda p, m, req: p.chat_completion(req, m)``. The function
        receives the provider instance, the model name (without the
        provider prefix), and the original request.
        """
        chain = self._resolve_chain(model_or_alias)
        attempts: list[tuple[str, str]] = []
        last_exc: Exception | None = None
        is_alias = AliasRegistry.is_alias(model_or_alias)

        for i, entry in enumerate(chain):
            next_entry = chain[i + 1] if i + 1 < len(chain) else ""
            provider_name, model_name = self._parse_model(entry)
            if provider_name not in self.providers:
                logger.debug(
                    "skip chain entry %s — provider %s not configured here",
                    entry,
                    provider_name,
                )
                attempts.append((entry, "unconfigured"))
                record_fallback(entry, next_entry, "unconfigured")
                continue

            if not self.health_cache.is_healthy(provider_name):
                logger.debug("skip chain entry %s — cache says unhealthy", entry)
                attempts.append((entry, "cache-unhealthy"))
                record_fallback(entry, next_entry, "cache-unhealthy")
                continue

            provider = self.providers[provider_name]
            self._check_tool_capability(provider, model_name, request)

            try:
                logger.info(
                    "execute → %s (alias=%s)",
                    entry,
                    model_or_alias if is_alias else "<direct>",
                )
                result = await call(provider, model_name, request)
                self.health_cache.mark_healthy(provider_name)
                set_provider_healthy(provider_name, True)
                if is_alias:
                    record_alias_resolved(model_or_alias, entry)
                return result
            except Exception as e:
                if not self._is_retryable(e):
                    # Caller error / non-retryable provider error — propagate
                    # without touching the health cache. The cache is for
                    # liveness, not for recording what the user asked for
                    # being wrong.
                    raise
                self.health_cache.mark_unhealthy(provider_name, self._exception_summary(e))
                set_provider_healthy(
                    provider_name, self.health_cache.is_healthy(provider_name)
                )
                attempts.append((entry, type(e).__name__))
                record_fallback(entry, next_entry, type(e).__name__)
                last_exc = e
                logger.warning(
                    "execute %s failed (retryable, will try next): %s",
                    entry,
                    e,
                )

        raise NoHealthyProviderError(model_or_alias, attempts, last_exc)

    # ------------------------------------------------------------------
    # Public API — non-streaming
    # ------------------------------------------------------------------

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
    ) -> ChatCompletionResponse:
        """Chat completion with alias resolution + health-aware fallback."""

        async def call(provider: LLMProvider, model: str, req: ChatCompletionRequest):
            return await provider.chat_completion(req, model)

        return await self._execute_with_fallback(request.model, request, call)

    # ------------------------------------------------------------------
    # Public API — streaming (pre-first-byte fallback)
    # ------------------------------------------------------------------

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Streaming variant. Falls back BEFORE the first chunk arrives;
        once the first chunk has been yielded the provider is committed
        and any further error propagates.

        Why pre-first-byte only: stitching half-streams from two different
        providers would mix two voices in the output and is impossible to
        sanity-check after the fact.
        """
        chain = self._resolve_chain(request.model)
        attempts: list[tuple[str, str]] = []
        last_exc: Exception | None = None
        is_alias = AliasRegistry.is_alias(request.model)

        for i, entry in enumerate(chain):
            next_entry = chain[i + 1] if i + 1 < len(chain) else ""
            provider_name, model_name = self._parse_model(entry)
            if provider_name not in self.providers:
                attempts.append((entry, "unconfigured"))
                record_fallback(entry, next_entry, "unconfigured")
                continue
            if not self.health_cache.is_healthy(provider_name):
                attempts.append((entry, "cache-unhealthy"))
                record_fallback(entry, next_entry, "cache-unhealthy")
                continue

            provider = self.providers[provider_name]
            self._check_tool_capability(provider, model_name, request)

            stream = provider.chat_completion_stream(request, model_name)
            try:
                first_chunk = await stream.__anext__()
            except StopAsyncIteration:
                # Empty stream is a successful but content-free response.
                # Commit and exit cleanly.
                self.health_cache.mark_healthy(provider_name)
                set_provider_healthy(provider_name, True)
                if is_alias:
                    record_alias_resolved(request.model, entry)
                logger.info("stream %s yielded empty response", entry)
                return
            except Exception as e:
                if not self._is_retryable(e):
                    raise
                self.health_cache.mark_unhealthy(provider_name, self._exception_summary(e))
                set_provider_healthy(
                    provider_name, self.health_cache.is_healthy(provider_name)
                )
                attempts.append((entry, type(e).__name__))
                record_fallback(entry, next_entry, type(e).__name__)
                last_exc = e
                logger.warning(
                    "stream %s failed before first byte (retryable, trying next): %s",
                    entry,
                    e,
                )
                continue

            # First byte landed — commit the provider, mark healthy, drain
            # the rest of the stream. Any error from here on propagates;
            # it is NOT safe to splice another provider's output in.
            self.health_cache.mark_healthy(provider_name)
            set_provider_healthy(provider_name, True)
            if is_alias:
                record_alias_resolved(request.model, entry)
            logger.info("stream → %s (committed after first chunk)", entry)
            yield first_chunk
            async for chunk in stream:
                yield chunk
            return

        raise NoHealthyProviderError(request.model, attempts, last_exc)

    # ------------------------------------------------------------------
    # Embeddings — no fallback (out of scope for M3, separate concerns)
    # ------------------------------------------------------------------

    async def embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Route an embeddings request directly. No alias / fallback."""
        provider_name, model_name = self._parse_model(request.model)
        if provider_name not in self.providers:
            available = list(self.providers)
            raise ValueError(
                f"Provider '{provider_name}' not available. Available: {available}"
            )
        provider = self.providers[provider_name]
        logger.info("embeddings → %s/%s", provider_name, model_name)
        return await provider.embeddings(request, model_name)

    # ------------------------------------------------------------------
    # Discovery / introspection
    # ------------------------------------------------------------------

    async def list_models(self) -> list[ModelInfo]:
        """List all available models from all configured providers.

        Best-effort: providers that error are skipped with a warning so a
        single broken provider can't take down ``GET /v1/models``.
        """
        all_models: list[ModelInfo] = []
        for provider in self.providers.values():
            try:
                all_models.extend(await provider.list_models())
            except Exception as e:  # noqa: BLE001
                logger.warning("Failed to list models from %s: %s", provider.name, e)
        return all_models

    async def get_model(self, model_id: str) -> ModelInfo | None:
        """Look up a single model by id, dispatching on the prefix."""
        provider_name, model_name = self._parse_model(model_id)
        if provider_name not in self.providers:
            return None
        models = await self.providers[provider_name].list_models()
        for m in models:
            if m.id == model_id or m.id.endswith(f"/{model_name}"):
                return m
        return None

    async def health_check(self) -> dict[str, Any]:
        """Snapshot of the per-provider liveness cache.

        Returns the same shape as before for backwards-compat with
        ``GET /health`` (deprecated structure — M4 will swap to a
        cleaner ``/v1/health`` endpoint).
        """
        snapshot = self.health_cache.snapshot(expected=list(self.providers))
        providers_out: dict[str, Any] = {}
        for name, state in snapshot.items():
            providers_out[name] = {
                "status": "healthy" if state.healthy else "unhealthy",
                "consecutive_failures": state.consecutive_failures,
                "last_error": state.last_error,
                "last_check_unix": state.last_check or None,
                "unhealthy_until_unix": state.unhealthy_until or None,
            }

        all_healthy = all(state.healthy for state in snapshot.values())
        any_healthy = any(state.healthy for state in snapshot.values())
        return {
            "status": "healthy" if all_healthy else ("degraded" if any_healthy else "unhealthy"),
            "providers": providers_out,
        }

    async def close(self) -> None:
        """Close all provider clients."""
        for provider in self.providers.values():
            await provider.close()
