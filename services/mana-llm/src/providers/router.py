"""Provider routing logic for mana-llm with auto-fallback support."""

import asyncio
import logging
import time
from collections.abc import AsyncIterator
from typing import Any

from src.config import settings
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
)

from .base import LLMProvider
from .errors import ProviderCapabilityError
from .ollama import OllamaProvider
from .openai_compat import OpenAICompatProvider

logger = logging.getLogger(__name__)


class ProviderRouter:
    """Routes requests to appropriate LLM providers with auto-fallback.

    When auto_fallback_enabled is True and a Google API key is configured:
    - Ollama requests that fail or exceed max_concurrent are automatically
      retried on Google Gemini with model mapping.
    - Explicit provider requests (e.g., openrouter/...) are never fallback-routed.
    """

    def __init__(self):
        self.providers: dict[str, LLMProvider] = {}
        self._ollama_concurrent: int = 0
        self._ollama_health_cache: tuple[dict[str, Any] | None, float] = (None, 0)
        self._health_cache_ttl: float = 5.0  # seconds
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Initialize available providers based on configuration."""
        # Ollama is always available (local)
        self.providers["ollama"] = OllamaProvider()
        logger.info(f"Initialized Ollama provider at {settings.ollama_url}")

        # Google Gemini (fallback provider)
        if settings.google_api_key:
            from .google import GoogleProvider

            self.providers["google"] = GoogleProvider(
                api_key=settings.google_api_key,
                default_model=settings.google_default_model,
            )
            logger.info("Initialized Google Gemini provider (fallback)")

        # OpenRouter (if API key configured)
        if settings.openrouter_api_key:
            self.providers["openrouter"] = OpenAICompatProvider(
                name="openrouter",
                base_url=settings.openrouter_base_url,
                api_key=settings.openrouter_api_key,
                default_model=settings.openrouter_default_model,
            )
            logger.info("Initialized OpenRouter provider")

        # Groq (if API key configured)
        if settings.groq_api_key:
            self.providers["groq"] = OpenAICompatProvider(
                name="groq",
                base_url=settings.groq_base_url,
                api_key=settings.groq_api_key,
            )
            logger.info("Initialized Groq provider")

        # Together (if API key configured)
        if settings.together_api_key:
            self.providers["together"] = OpenAICompatProvider(
                name="together",
                base_url=settings.together_base_url,
                api_key=settings.together_api_key,
            )
            logger.info("Initialized Together provider")

    def _parse_model(self, model: str) -> tuple[str, str]:
        """Parse model string into (provider, model_name)."""
        if "/" in model:
            parts = model.split("/", 1)
            provider = parts[0].lower()
            model_name = parts[1]
        else:
            provider = "ollama"
            model_name = model

        return provider, model_name

    def _get_provider(self, provider_name: str) -> LLMProvider:
        """Get provider by name, raise if not available."""
        if provider_name not in self.providers:
            available = list(self.providers.keys())
            raise ValueError(
                f"Provider '{provider_name}' not available. "
                f"Available providers: {available}"
            )
        return self.providers[provider_name]

    def _can_fallback_to_google(self, provider_name: str) -> bool:
        """Check if a request can be fallback-routed to Google."""
        return (
            settings.auto_fallback_enabled
            and provider_name == "ollama"
            and "google" in self.providers
        )

    def _should_use_ollama(self) -> bool:
        """Determine if Ollama should handle the request based on load."""
        return self._ollama_concurrent < settings.ollama_max_concurrent

    async def _get_ollama_health_cached(self) -> dict[str, Any]:
        """Get Ollama health with caching (5s TTL)."""
        cached, cached_at = self._ollama_health_cache
        if cached is not None and (time.time() - cached_at) < self._health_cache_ttl:
            return cached

        try:
            provider = self.providers.get("ollama")
            if provider:
                result = await provider.health_check()
            else:
                result = {"status": "unhealthy", "error": "no ollama provider"}
        except Exception as e:
            result = {"status": "unhealthy", "error": str(e)}

        self._ollama_health_cache = (result, time.time())
        return result

    async def _fallback_to_google(
        self,
        request: ChatCompletionRequest,
        model_name: str,
        original_error: Exception | None = None,
    ) -> ChatCompletionResponse:
        """Route a request to Google Gemini as fallback."""
        from .google import GoogleProvider

        google = self.providers["google"]
        assert isinstance(google, GoogleProvider)

        gemini_model = google.map_model(model_name)
        reason = f"error: {original_error}" if original_error else "overloaded"
        logger.warning(
            f"Falling back to Google Gemini ({gemini_model}) for ollama/{model_name} ({reason})"
        )
        return await google.chat_completion(request, gemini_model)

    def _check_tool_capability(
        self, provider: LLMProvider, model_name: str, request: ChatCompletionRequest
    ) -> None:
        """Refuse tool-bearing requests for providers/models without tool support.

        Silent downgrade (dropping the `tools` payload) is more dangerous
        than an explicit error — the caller would get plain text back and
        have no way to tell the tools never reached the model.
        """
        if not request.tools:
            return
        if not provider.model_supports_tools(model_name):
            raise ProviderCapabilityError(
                f"{provider.name}/{model_name} does not support tool calling. "
                "Choose a tool-capable model (e.g. gemini-2.5-flash, llama3.1:*)"
            )

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
    ) -> ChatCompletionResponse:
        """Route chat completion request with auto-fallback."""
        provider_name, model_name = self._parse_model(request.model)

        # Non-Ollama providers: direct routing, no fallback
        if provider_name != "ollama":
            provider = self._get_provider(provider_name)
            self._check_tool_capability(provider, model_name, request)
            logger.info(f"Routing chat completion to {provider_name}/{model_name}")
            return await provider.chat_completion(request, model_name)

        # Ollama with fallback logic
        can_fallback = self._can_fallback_to_google(provider_name)

        # Check if Ollama is overloaded
        if can_fallback and not self._should_use_ollama():
            return await self._fallback_to_google(request, model_name)

        # Try Ollama first
        provider = self._get_provider("ollama")
        self._check_tool_capability(provider, model_name, request)
        logger.info(f"Routing chat completion to ollama/{model_name}")
        self._ollama_concurrent += 1

        try:
            return await provider.chat_completion(request, model_name)
        except Exception as e:
            logger.error(f"Chat completion failed on ollama: {e}")
            if can_fallback:
                return await self._fallback_to_google(request, model_name, e)
            raise
        finally:
            self._ollama_concurrent -= 1

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Route streaming chat completion with auto-fallback."""
        provider_name, model_name = self._parse_model(request.model)

        # Non-Ollama: direct
        if provider_name != "ollama":
            provider = self._get_provider(provider_name)
            self._check_tool_capability(provider, model_name, request)
            logger.info(f"Routing streaming to {provider_name}/{model_name}")
            async for chunk in provider.chat_completion_stream(request, model_name):
                yield chunk
            return

        # Ollama with fallback
        can_fallback = self._can_fallback_to_google(provider_name)

        if can_fallback and not self._should_use_ollama():
            from .google import GoogleProvider

            google = self.providers["google"]
            assert isinstance(google, GoogleProvider)
            gemini_model = google.map_model(model_name)
            logger.warning(f"Streaming fallback to Google Gemini ({gemini_model})")
            async for chunk in google.chat_completion_stream(request, gemini_model):
                yield chunk
            return

        provider = self._get_provider("ollama")
        self._check_tool_capability(provider, model_name, request)
        logger.info(f"Routing streaming to ollama/{model_name}")
        self._ollama_concurrent += 1

        try:
            async for chunk in provider.chat_completion_stream(request, model_name):
                yield chunk
        except Exception as e:
            logger.error(f"Streaming failed on ollama: {e}")
            if can_fallback:
                from .google import GoogleProvider

                google = self.providers["google"]
                assert isinstance(google, GoogleProvider)
                gemini_model = google.map_model(model_name)
                logger.warning(f"Streaming fallback to Google Gemini ({gemini_model})")
                async for chunk in google.chat_completion_stream(request, gemini_model):
                    yield chunk
            else:
                raise
        finally:
            self._ollama_concurrent -= 1

    async def embeddings(
        self,
        request: EmbeddingRequest,
    ) -> EmbeddingResponse:
        """Route embeddings request to appropriate provider."""
        provider_name, model_name = self._parse_model(request.model)
        provider = self._get_provider(provider_name)

        logger.info(f"Routing embeddings to {provider_name}/{model_name}")

        return await provider.embeddings(request, model_name)

    async def list_models(self) -> list[ModelInfo]:
        """List all available models from all providers."""
        all_models: list[ModelInfo] = []

        for provider in self.providers.values():
            try:
                models = await provider.list_models()
                all_models.extend(models)
            except Exception as e:
                logger.warning(f"Failed to list models from {provider.name}: {e}")

        return all_models

    async def get_model(self, model_id: str) -> ModelInfo | None:
        """Get specific model info."""
        provider_name, model_name = self._parse_model(model_id)

        if provider_name not in self.providers:
            return None

        provider = self.providers[provider_name]
        models = await provider.list_models()

        for model in models:
            if model.id == model_id or model.id.endswith(f"/{model_name}"):
                return model

        return None

    async def health_check(self) -> dict[str, Any]:
        """Check health of all providers."""
        results: dict[str, Any] = {}

        for name, provider in self.providers.items():
            results[name] = await provider.health_check()

        # Overall status
        all_healthy = all(r.get("status") == "healthy" for r in results.values())
        any_healthy = any(r.get("status") == "healthy" for r in results.values())

        status_info: dict[str, Any] = {
            "status": "healthy" if all_healthy else ("degraded" if any_healthy else "unhealthy"),
            "providers": results,
        }

        # Include fallback info
        if settings.auto_fallback_enabled and "google" in self.providers:
            status_info["fallback"] = {
                "enabled": True,
                "ollama_concurrent": self._ollama_concurrent,
                "ollama_max_concurrent": settings.ollama_max_concurrent,
            }

        return status_info

    async def close(self) -> None:
        """Close all providers."""
        for provider in self.providers.values():
            await provider.close()
