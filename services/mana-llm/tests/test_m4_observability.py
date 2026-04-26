"""Tests for M4: observability + debug endpoints + reload."""

from __future__ import annotations

import asyncio
import os
import signal
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from prometheus_client import REGISTRY

from src.aliases import AliasRegistry
from src.health import ProviderHealthCache
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    Choice,
    Message,
    MessageResponse,
)
from src.providers import ProviderRouter
from src.utils.metrics import (
    record_alias_resolved,
    record_fallback,
    set_provider_healthy,
)


# ---------------------------------------------------------------------------
# Cache → listener → metric gauge
# ---------------------------------------------------------------------------


class TestHealthChangeListener:
    def test_listener_fires_on_unhealthy_transition(self) -> None:
        cache = ProviderHealthCache(failure_threshold=2)
        events: list[tuple[str, bool]] = []
        cache.add_listener(lambda p, h: events.append((p, h)))

        # First failure: still healthy → no transition.
        cache.mark_unhealthy("ollama", "blip")
        assert events == []

        # Second failure: transition healthy→unhealthy → fires.
        cache.mark_unhealthy("ollama", "boom")
        assert events == [("ollama", False)]

    def test_listener_fires_on_recovery(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        events: list[tuple[str, bool]] = []
        cache.add_listener(lambda p, h: events.append((p, h)))

        cache.mark_unhealthy("ollama", "boom")
        assert events == [("ollama", False)]

        cache.mark_healthy("ollama")
        assert events == [("ollama", False), ("ollama", True)]

    def test_steady_state_does_not_fire(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        events: list[tuple[str, bool]] = []
        cache.add_listener(lambda p, h: events.append((p, h)))

        # Three healthy ops in a row — no transitions, no events.
        for _ in range(3):
            cache.mark_healthy("ollama")
        assert events == []

    def test_listener_exception_does_not_break_cache(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)

        def bad(_provider: str, _healthy: bool) -> None:
            raise RuntimeError("listener boom")

        cache.add_listener(bad)
        # Should NOT raise — the cache must keep working with a broken
        # listener, otherwise one bad metric callback would brick the
        # whole router.
        cache.mark_unhealthy("ollama", "x")
        assert cache.is_healthy("ollama") is False

    def test_multiple_listeners(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        a: list = []
        b: list = []
        cache.add_listener(lambda p, h: a.append((p, h)))
        cache.add_listener(lambda p, h: b.append((p, h)))

        cache.mark_unhealthy("ollama", "x")
        assert a == [("ollama", False)]
        assert b == [("ollama", False)]


# ---------------------------------------------------------------------------
# Prometheus metrics — counters/gauges actually move
# ---------------------------------------------------------------------------


def _counter_value(name: str, labels: dict[str, str]) -> float:
    """Helper: read the current value of a labeled Prometheus metric."""
    samples = REGISTRY.get_sample_value(name, labels=labels)
    return samples or 0.0


class TestMetricsRecording:
    def test_record_alias_resolved_increments(self) -> None:
        before = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "mana/test-class", "target": "ollama/x:1b"},
        )
        record_alias_resolved("mana/test-class", "ollama/x:1b")
        after = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "mana/test-class", "target": "ollama/x:1b"},
        )
        assert after - before == pytest.approx(1.0)

    def test_record_fallback_increments(self) -> None:
        before = _counter_value(
            "mana_llm_fallback_total",
            {"from_model": "ollama/x", "to_model": "groq/y", "reason": "ConnectError"},
        )
        record_fallback("ollama/x", "groq/y", "ConnectError")
        after = _counter_value(
            "mana_llm_fallback_total",
            {"from_model": "ollama/x", "to_model": "groq/y", "reason": "ConnectError"},
        )
        assert after - before == pytest.approx(1.0)

    def test_set_provider_healthy_writes_gauge(self) -> None:
        set_provider_healthy("test_provider_xyz", True)
        v = REGISTRY.get_sample_value(
            "mana_llm_provider_healthy", labels={"provider": "test_provider_xyz"}
        )
        assert v == 1.0

        set_provider_healthy("test_provider_xyz", False)
        v = REGISTRY.get_sample_value(
            "mana_llm_provider_healthy", labels={"provider": "test_provider_xyz"}
        )
        assert v == 0.0


# ---------------------------------------------------------------------------
# Router → metrics: end-to-end through a fallback
# ---------------------------------------------------------------------------


class _OkProvider:
    """Minimal provider double — only what the router uses for chat."""

    name = "ok-provider"
    supports_tools = True

    def __init__(self, name: str, fail_with: BaseException | None = None) -> None:
        self.name = name
        self.fail_with = fail_with
        self.calls = 0

    def model_supports_tools(self, model: str) -> bool:
        return True

    async def chat_completion(self, request, model):
        self.calls += 1
        if self.fail_with is not None:
            raise self.fail_with
        return ChatCompletionResponse(
            model=f"{self.name}/{model}",
            choices=[Choice(message=MessageResponse(content="ok"))],
        )

    async def chat_completion_stream(self, request, model):  # pragma: no cover
        if False:  # pragma: no cover
            yield None

    async def list_models(self):
        return []

    async def embeddings(self, request, model):
        raise NotImplementedError

    async def health_check(self):
        return {"status": "healthy"}

    async def close(self):
        pass


def _aliases(tmp_path: Path) -> AliasRegistry:
    cfg = (
        "aliases:\n"
        "  mana/two-step:\n"
        '    description: "x"\n'
        "    chain:\n"
        "      - alpha/m1\n"
        "      - beta/m2\n"
    )
    p = tmp_path / "aliases.yaml"
    p.write_text(cfg)
    return AliasRegistry(p)


class TestRouterMetricsIntegration:
    @pytest.mark.asyncio
    async def test_alias_resolved_metric_records_target(self, tmp_path: Path) -> None:
        aliases = _aliases(tmp_path)
        cache = ProviderHealthCache()
        router = ProviderRouter(aliases=aliases, health_cache=cache)
        router.providers = {"alpha": _OkProvider("alpha")}  # beta not configured

        before = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "mana/two-step", "target": "alpha/m1"},
        )
        await router.chat_completion(
            ChatCompletionRequest(
                model="mana/two-step",
                messages=[Message(role="user", content="hi")],
            )
        )
        after = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "mana/two-step", "target": "alpha/m1"},
        )
        assert after - before == pytest.approx(1.0)

    @pytest.mark.asyncio
    async def test_fallback_metric_records_transition(self, tmp_path: Path) -> None:
        aliases = _aliases(tmp_path)
        cache = ProviderHealthCache()
        router = ProviderRouter(aliases=aliases, health_cache=cache)
        router.providers = {
            "alpha": _OkProvider("alpha", fail_with=httpx.ConnectError("dead")),
            "beta": _OkProvider("beta"),
        }

        before = _counter_value(
            "mana_llm_fallback_total",
            {"from_model": "alpha/m1", "to_model": "beta/m2", "reason": "ConnectError"},
        )
        await router.chat_completion(
            ChatCompletionRequest(
                model="mana/two-step",
                messages=[Message(role="user", content="hi")],
            )
        )
        after = _counter_value(
            "mana_llm_fallback_total",
            {"from_model": "alpha/m1", "to_model": "beta/m2", "reason": "ConnectError"},
        )
        assert after - before == pytest.approx(1.0)

    @pytest.mark.asyncio
    async def test_direct_model_does_not_record_alias_metric(
        self, tmp_path: Path
    ) -> None:
        # Direct provider/model is not an alias — ALIAS_RESOLVED counter
        # must stay flat for those calls.
        aliases = _aliases(tmp_path)
        cache = ProviderHealthCache()
        router = ProviderRouter(aliases=aliases, health_cache=cache)
        router.providers = {"alpha": _OkProvider("alpha")}

        before = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "alpha/anything", "target": "alpha/anything"},
        )
        await router.chat_completion(
            ChatCompletionRequest(
                model="alpha/anything",
                messages=[Message(role="user", content="hi")],
            )
        )
        after = _counter_value(
            "mana_llm_alias_resolved_total",
            {"alias": "alpha/anything", "target": "alpha/anything"},
        )
        # Counter must have NOT increased — direct calls aren't aliases.
        assert after == before


# ---------------------------------------------------------------------------
# Debug endpoints: GET /v1/aliases, GET /v1/health
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    from src.main import app

    with TestClient(app) as c:
        yield c


class TestDebugEndpoints:
    def test_v1_aliases_returns_shipped_config(self, client: TestClient) -> None:
        resp = client.get("/v1/aliases")
        assert resp.status_code == 200
        data = resp.json()
        names = [a["name"] for a in data["aliases"]]
        # The five canonical classes must always be present.
        for expected in (
            "mana/fast-text",
            "mana/long-form",
            "mana/structured",
            "mana/reasoning",
            "mana/vision",
        ):
            assert expected in names
        # Default is set in the shipped config.
        assert data["default"] == "mana/fast-text"

    def test_v1_aliases_chain_format(self, client: TestClient) -> None:
        resp = client.get("/v1/aliases")
        data = resp.json()
        long_form = next(a for a in data["aliases"] if a["name"] == "mana/long-form")
        # Each chain entry is a `provider/model` string.
        assert all("/" in entry for entry in long_form["chain"])
        assert len(long_form["chain"]) >= 2  # plan requires at least one cloud fallback

    def test_v1_health_includes_all_providers(self, client: TestClient) -> None:
        resp = client.get("/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "providers" in data
        # ollama is always configured (provider list is non-empty).
        assert "ollama" in data["providers"]
        for name, info in data["providers"].items():
            assert "status" in info
            assert "consecutive_failures" in info


# ---------------------------------------------------------------------------
# X-Mana-LLM-Resolved header on non-streaming responses
# ---------------------------------------------------------------------------


class TestResolvedHeader:
    """The header is the consumer's hook for token-cost attribution.

    Tested at the router level — wiring through main.py would need a
    real provider connection, which isn't available in unit tests.
    """

    @pytest.mark.asyncio
    async def test_response_model_field_carries_resolved_target(
        self, tmp_path: Path
    ) -> None:
        # The header value is `response.model`; verify that field reflects
        # the actual chain entry that served, not the requested alias.
        aliases = _aliases(tmp_path)
        cache = ProviderHealthCache()
        router = ProviderRouter(aliases=aliases, health_cache=cache)
        # Force fallback to beta.
        router.providers = {
            "alpha": _OkProvider("alpha", fail_with=httpx.ConnectError("d")),
            "beta": _OkProvider("beta"),
        }

        resp = await router.chat_completion(
            ChatCompletionRequest(
                model="mana/two-step",
                messages=[Message(role="user", content="hi")],
            )
        )
        # Even though the caller asked for `mana/two-step`, the resolved
        # field shows the entry that actually answered.
        assert resp.model == "beta/m2"


# ---------------------------------------------------------------------------
# SIGHUP reload — only meaningful on Unix; tested by signalling the proc
# ---------------------------------------------------------------------------


class TestSighupReload:
    """SIGHUP triggers ``alias_registry.reload()``; reload-error keeps state.

    The signal-handler wiring lives in main.py and only installs when
    the loop is running in the main thread. We exercise the reload
    semantics here directly on the registry instead — the signal-handler
    code path itself is a 4-line wrapper around ``reload()``.
    """

    def test_reload_picks_up_yaml_edits(self, tmp_path: Path) -> None:
        path = tmp_path / "aliases.yaml"
        path.write_text(
            "aliases:\n"
            "  mana/x:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/foo:1b\n"
        )
        reg = AliasRegistry(path)
        assert reg.resolve_chain("mana/x") == ("ollama/foo:1b",)

        # Edit on disk, reload (this is exactly what the SIGHUP handler
        # does — minus the signal plumbing).
        path.write_text(
            "aliases:\n"
            "  mana/x:\n"
            '    description: "x"\n'
            "    chain:\n"
            "      - ollama/bar:1b\n"
            "      - groq/llama-3.1-8b-instant\n"
        )
        reg.reload()
        assert reg.resolve_chain("mana/x") == (
            "ollama/bar:1b",
            "groq/llama-3.1-8b-instant",
        )
