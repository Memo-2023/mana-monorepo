"""Tests for ProviderRouter fallback / alias execution (M3)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import httpx
import pytest

from src.aliases import AliasRegistry
from src.health import ProviderHealthCache
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    Choice,
    DeltaContent,
    EmbeddingRequest,
    EmbeddingResponse,
    Message,
    MessageResponse,
    ModelInfo,
    StreamChoice,
)
from src.providers import ProviderRouter
from src.providers.base import LLMProvider
from src.providers.errors import (
    NoHealthyProviderError,
    ProviderAuthError,
    ProviderCapabilityError,
    ProviderRateLimitError,
)


# ---------------------------------------------------------------------------
# Test doubles
# ---------------------------------------------------------------------------


class MockProvider(LLMProvider):
    """Provider that lets tests inject a sequence of behaviours.

    Each call pops one entry from ``behaviors``. Strings ``"ok"`` and
    ``"empty"`` are sentinels for normal returns; everything else (a
    BaseException instance / class) is raised.
    """

    supports_tools = True

    def __init__(self, name: str, behaviors: list[Any] | None = None) -> None:
        self.name = name
        self._behaviors: list[Any] = list(behaviors or [])
        self.calls: list[str] = []

    def push(self, *behaviors: Any) -> None:
        self._behaviors.extend(behaviors)

    def _next(self) -> Any:
        return self._behaviors.pop(0) if self._behaviors else "ok"

    async def chat_completion(
        self, request: ChatCompletionRequest, model: str
    ) -> ChatCompletionResponse:
        self.calls.append(model)
        b = self._next()
        if isinstance(b, type) and issubclass(b, BaseException):
            raise b("simulated")
        if isinstance(b, BaseException):
            raise b
        return _ok_response(self.name, model)

    async def chat_completion_stream(
        self, request: ChatCompletionRequest, model: str
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        self.calls.append(model)
        b = self._next()
        if isinstance(b, type) and issubclass(b, BaseException):
            raise b("simulated")
        if isinstance(b, BaseException):
            raise b
        if b == "empty":
            return
        for content in ("Hello", " ", "world"):
            yield ChatCompletionStreamResponse(
                model=f"{self.name}/{model}",
                choices=[StreamChoice(delta=DeltaContent(content=content))],
            )

    async def list_models(self) -> list[ModelInfo]:
        return [ModelInfo(id=f"{self.name}/{m}") for m in ("modelA", "modelB")]

    async def embeddings(
        self, request: EmbeddingRequest, model: str
    ) -> EmbeddingResponse:
        raise NotImplementedError

    async def health_check(self) -> dict[str, Any]:
        return {"status": "healthy"}


class FailFirstChunkProvider(MockProvider):
    """Streaming provider that raises BEFORE the first chunk every time.

    Kept separate from MockProvider's behaviour list so the per-call
    semantics stay simple — this one models a permanently-broken streamer.
    """

    def __init__(self, name: str, exc: BaseException) -> None:
        super().__init__(name)
        self._exc = exc

    async def chat_completion_stream(self, request, model):  # type: ignore[override]
        self.calls.append(model)
        raise self._exc
        # the yield is unreachable but keeps the function an async generator
        yield  # pragma: no cover


def _ok_response(provider: str, model: str) -> ChatCompletionResponse:
    return ChatCompletionResponse(
        model=f"{provider}/{model}",
        choices=[
            Choice(
                message=MessageResponse(content="ok"),
                finish_reason="stop",
            )
        ],
    )


def _request(model: str) -> ChatCompletionRequest:
    return ChatCompletionRequest(
        model=model,
        messages=[Message(role="user", content="hi")],
    )


def _aliases_yaml(tmp_path) -> AliasRegistry:
    """A two-alias config used across most tests."""
    cfg = (
        "aliases:\n"
        "  mana/long-form:\n"
        '    description: "long"\n'
        "    chain:\n"
        "      - alpha/m1\n"
        "      - beta/m2\n"
        "      - gamma/m3\n"
        "  mana/single:\n"
        '    description: "single-entry"\n'
        "    chain:\n"
        "      - alpha/solo\n"
    )
    p = tmp_path / "aliases.yaml"
    p.write_text(cfg)
    return AliasRegistry(p)


def _make_router(
    tmp_path,
    *,
    providers: dict[str, MockProvider],
    cache: ProviderHealthCache | None = None,
) -> ProviderRouter:
    aliases = _aliases_yaml(tmp_path)
    router = ProviderRouter(aliases=aliases, health_cache=cache or ProviderHealthCache())
    # Replace the auto-initialised live providers with the test doubles.
    router.providers = dict(providers)
    return router


# ---------------------------------------------------------------------------
# Non-streaming chain walking
# ---------------------------------------------------------------------------


class TestChatCompletionChain:
    @pytest.mark.asyncio
    async def test_first_provider_ok_returns_immediately(self, tmp_path) -> None:
        alpha = MockProvider("alpha", ["ok"])
        beta = MockProvider("beta")
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        resp = await router.chat_completion(_request("mana/long-form"))

        assert resp.model == "alpha/m1"
        assert alpha.calls == ["m1"]
        assert beta.calls == []  # never reached

    @pytest.mark.asyncio
    async def test_falls_through_on_connect_error(self, tmp_path) -> None:
        alpha = MockProvider("alpha", [httpx.ConnectError("dead")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        resp = await router.chat_completion(_request("mana/long-form"))

        assert resp.model == "beta/m2"
        assert alpha.calls == ["m1"]
        assert beta.calls == ["m2"]

    @pytest.mark.asyncio
    async def test_skips_unconfigured_chain_entries(self, tmp_path) -> None:
        # gamma isn't configured at all → chain should silently skip it
        # rather than raise.
        alpha = MockProvider("alpha", [httpx.ConnectError("dead")])
        beta = MockProvider("beta", [httpx.ConnectError("dead too")])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(NoHealthyProviderError) as exc_info:
            await router.chat_completion(_request("mana/long-form"))
        # All three entries appear in attempts: two as ConnectError, one
        # as unconfigured (not a fatal error, just skipped).
        attempts = exc_info.value.attempts
        assert ("alpha/m1", "ConnectError") in attempts
        assert ("beta/m2", "ConnectError") in attempts
        assert ("gamma/m3", "unconfigured") in attempts

    @pytest.mark.asyncio
    async def test_skips_cache_unhealthy(self, tmp_path) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        cache.mark_unhealthy("alpha", "stale")
        alpha = MockProvider("alpha", ["ok"])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(
            tmp_path, providers={"alpha": alpha, "beta": beta}, cache=cache
        )

        resp = await router.chat_completion(_request("mana/long-form"))

        assert alpha.calls == []  # router skipped per cache
        assert beta.calls == ["m2"]
        assert resp.model == "beta/m2"

    @pytest.mark.asyncio
    async def test_5xx_treated_as_retryable(self, tmp_path) -> None:
        five_hundred = httpx.HTTPStatusError(
            "boom",
            request=httpx.Request("POST", "http://x"),
            response=httpx.Response(503),
        )
        alpha = MockProvider("alpha", [five_hundred])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        resp = await router.chat_completion(_request("mana/long-form"))

        assert resp.model == "beta/m2"

    @pytest.mark.asyncio
    async def test_4xx_propagates(self, tmp_path) -> None:
        four_hundred = httpx.HTTPStatusError(
            "bad request",
            request=httpx.Request("POST", "http://x"),
            response=httpx.Response(422),
        )
        alpha = MockProvider("alpha", [four_hundred])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(httpx.HTTPStatusError):
            await router.chat_completion(_request("mana/long-form"))
        # Beta never tried — caller's request needs fixing, retrying
        # against another model would just hide the bug.
        assert beta.calls == []

    @pytest.mark.asyncio
    async def test_capability_error_propagates(self, tmp_path) -> None:
        alpha = MockProvider("alpha", [ProviderCapabilityError("no tools")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(ProviderCapabilityError):
            await router.chat_completion(_request("mana/long-form"))
        assert beta.calls == []

    @pytest.mark.asyncio
    async def test_auth_error_propagates(self, tmp_path) -> None:
        # Auth errors mean OUR setup is broken (wrong key); falling back
        # to the next provider hides the misconfiguration.
        alpha = MockProvider("alpha", [ProviderAuthError("bad key")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(ProviderAuthError):
            await router.chat_completion(_request("mana/long-form"))
        assert beta.calls == []

    @pytest.mark.asyncio
    async def test_rate_limit_is_retryable(self, tmp_path) -> None:
        alpha = MockProvider("alpha", [ProviderRateLimitError("slow down")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        resp = await router.chat_completion(_request("mana/long-form"))

        assert resp.model == "beta/m2"

    @pytest.mark.asyncio
    async def test_all_fail_raises_no_healthy_provider(self, tmp_path) -> None:
        alpha = MockProvider("alpha", [httpx.ConnectError("a")])
        beta = MockProvider("beta", [httpx.ConnectError("b")])
        gamma = MockProvider("gamma", [httpx.ConnectError("c")])
        router = _make_router(
            tmp_path, providers={"alpha": alpha, "beta": beta, "gamma": gamma}
        )

        with pytest.raises(NoHealthyProviderError) as exc_info:
            await router.chat_completion(_request("mana/long-form"))
        assert exc_info.value.model_or_alias == "mana/long-form"
        assert isinstance(exc_info.value.last_exception, httpx.ConnectError)
        # 503 status so calling code (mana-api etc.) can decide to retry
        # later vs surface a clean error to the user.
        assert exc_info.value.http_status == 503

    @pytest.mark.asyncio
    async def test_direct_provider_string_no_alias_resolution(self, tmp_path) -> None:
        # Caller bypasses aliases by passing a direct provider/model.
        # No fallback chain — fail = fail.
        alpha = MockProvider("alpha", [httpx.ConnectError("dead")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(NoHealthyProviderError):
            await router.chat_completion(_request("alpha/anything"))
        # Beta would have served if this had been an alias — but it
        # wasn't, so beta never gets touched.
        assert beta.calls == []


# ---------------------------------------------------------------------------
# Health-cache feedback: success clears, failure marks
# ---------------------------------------------------------------------------


class TestHealthCacheFeedback:
    @pytest.mark.asyncio
    async def test_success_marks_provider_healthy(self, tmp_path) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        cache.mark_unhealthy("alpha", "stale-from-probe")
        # After the cache TTL the cache thinks alpha might be OK again,
        # so the router will try it; success must fully clear the state.
        # (Force half-open by zeroing backoff.)
        alpha = MockProvider("alpha", ["ok"])
        router = _make_router(
            tmp_path,
            providers={"alpha": alpha},
            cache=ProviderHealthCache(),  # fresh cache, alpha optimistic
        )

        await router.chat_completion(_request("mana/single"))

        assert router.health_cache.get_state("alpha").healthy is True
        assert router.health_cache.get_state("alpha").consecutive_failures == 0

    @pytest.mark.asyncio
    async def test_failure_marks_provider_unhealthy(self, tmp_path) -> None:
        # threshold=1 so a single fail is enough to flip the breaker.
        cache = ProviderHealthCache(failure_threshold=1)
        alpha = MockProvider("alpha", [httpx.ConnectError("boom")])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(
            tmp_path, providers={"alpha": alpha, "beta": beta}, cache=cache
        )

        await router.chat_completion(_request("mana/long-form"))

        assert cache.get_state("alpha").healthy is False
        assert cache.get_state("alpha").last_error is not None
        assert "ConnectError" in cache.get_state("alpha").last_error

    @pytest.mark.asyncio
    async def test_propagating_error_does_not_touch_cache(self, tmp_path) -> None:
        # Auth/Capability errors are about CALLER state, not provider
        # health — the cache must stay clean so a real outage later
        # isn't masked by stale "marked unhealthy because of bad key".
        cache = ProviderHealthCache(failure_threshold=1)
        alpha = MockProvider("alpha", [ProviderAuthError("bad key")])
        router = _make_router(tmp_path, providers={"alpha": alpha}, cache=cache)

        with pytest.raises(ProviderAuthError):
            await router.chat_completion(_request("mana/single"))

        # No state recorded.
        assert cache.get_state("alpha") is None


# ---------------------------------------------------------------------------
# Streaming pre-first-byte fallback
# ---------------------------------------------------------------------------


class TestChatCompletionStream:
    @pytest.mark.asyncio
    async def test_first_provider_streams_normally(self, tmp_path) -> None:
        alpha = MockProvider("alpha", ["ok"])
        beta = MockProvider("beta")
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        chunks = [
            c async for c in router.chat_completion_stream(_request("mana/long-form"))
        ]

        assert beta.calls == []
        assert len(chunks) == 3
        assert "".join(c.choices[0].delta.content or "" for c in chunks) == "Hello world"

    @pytest.mark.asyncio
    async def test_pre_first_byte_failure_falls_back(self, tmp_path) -> None:
        alpha = FailFirstChunkProvider("alpha", httpx.ConnectError("dead"))
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        chunks = [
            c async for c in router.chat_completion_stream(_request("mana/long-form"))
        ]

        assert alpha.calls == ["m1"]
        assert beta.calls == ["m2"]
        assert len(chunks) == 3
        assert all(c.model == "beta/m2" for c in chunks)

    @pytest.mark.asyncio
    async def test_pre_first_byte_4xx_propagates_no_fallback(self, tmp_path) -> None:
        alpha = FailFirstChunkProvider("alpha", ProviderCapabilityError("no tools"))
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        with pytest.raises(ProviderCapabilityError):
            async for _ in router.chat_completion_stream(_request("mana/long-form")):
                pass
        assert beta.calls == []

    @pytest.mark.asyncio
    async def test_empty_stream_commits_without_fallback(self, tmp_path) -> None:
        # Empty-but-successful stream is a valid response, not a failure
        # we should retry — committing avoids accidentally calling two
        # providers and double-billing.
        alpha = MockProvider("alpha", ["empty"])
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        chunks = [
            c async for c in router.chat_completion_stream(_request("mana/long-form"))
        ]

        assert chunks == []
        assert beta.calls == []  # didn't fall through

    @pytest.mark.asyncio
    async def test_mid_stream_failure_does_not_fall_back(self, tmp_path) -> None:
        # Custom provider that yields once then raises mid-stream — the
        # router has already committed and must let the error propagate
        # rather than splice in another provider's voice.
        class MidStreamFailProvider(MockProvider):
            async def chat_completion_stream(self, request, model):  # type: ignore[override]
                self.calls.append(model)
                yield ChatCompletionStreamResponse(
                    model=f"{self.name}/{model}",
                    choices=[StreamChoice(delta=DeltaContent(content="halb"))],
                )
                raise httpx.RemoteProtocolError("connection dropped")

        alpha = MidStreamFailProvider("alpha")
        beta = MockProvider("beta", ["ok"])
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        collected: list[str] = []
        with pytest.raises(httpx.RemoteProtocolError):
            async for chunk in router.chat_completion_stream(_request("mana/long-form")):
                collected.append(chunk.choices[0].delta.content or "")

        # We got the half-chunk that landed before the break; beta was
        # NOT called as fallback.
        assert collected == ["halb"]
        assert beta.calls == []

    @pytest.mark.asyncio
    async def test_all_fail_streaming_raises_no_healthy_provider(self, tmp_path) -> None:
        alpha = FailFirstChunkProvider("alpha", httpx.ConnectError("a"))
        beta = FailFirstChunkProvider("beta", httpx.ConnectError("b"))
        gamma = FailFirstChunkProvider("gamma", httpx.ConnectError("c"))
        router = _make_router(
            tmp_path, providers={"alpha": alpha, "beta": beta, "gamma": gamma}
        )

        with pytest.raises(NoHealthyProviderError):
            async for _ in router.chat_completion_stream(_request("mana/long-form")):
                pass


# ---------------------------------------------------------------------------
# Health-check shape (still using the cache snapshot)
# ---------------------------------------------------------------------------


class TestHealthCheck:
    @pytest.mark.asyncio
    async def test_health_check_lists_known_providers(self, tmp_path) -> None:
        # Even if no probe has run yet, every configured provider should
        # appear in the snapshot (zero-defaults) so /health has a stable
        # shape for monitors.
        alpha = MockProvider("alpha")
        beta = MockProvider("beta")
        router = _make_router(tmp_path, providers={"alpha": alpha, "beta": beta})

        out = await router.health_check()

        assert set(out["providers"].keys()) == {"alpha", "beta"}
        assert out["status"] == "healthy"
        assert all(p["status"] == "healthy" for p in out["providers"].values())

    @pytest.mark.asyncio
    async def test_health_check_degraded_when_one_unhealthy(self, tmp_path) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        cache.mark_unhealthy("alpha", "boom")
        alpha = MockProvider("alpha")
        beta = MockProvider("beta")
        router = _make_router(
            tmp_path, providers={"alpha": alpha, "beta": beta}, cache=cache
        )

        out = await router.health_check()
        assert out["status"] == "degraded"
        assert out["providers"]["alpha"]["status"] == "unhealthy"
        assert out["providers"]["beta"]["status"] == "healthy"
