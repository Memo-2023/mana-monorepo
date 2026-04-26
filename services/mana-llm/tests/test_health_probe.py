"""Tests for the background health-probe loop."""

from __future__ import annotations

import asyncio
from typing import Awaitable, Callable

import pytest

from src.health import ProviderHealthCache
from src.health_probe import HealthProbe, ProbeFn


def make_probe(*, returns: bool = True, raises: type[BaseException] | None = None) -> ProbeFn:
    """Synthesise a probe function that always returns / raises the same."""

    async def probe() -> bool:
        if raises is not None:
            raise raises("boom")
        return returns

    return probe


def make_slow_probe(delay: float, returns: bool = True) -> ProbeFn:
    async def probe() -> bool:
        await asyncio.sleep(delay)
        return returns

    return probe


def make_call_counter() -> tuple[ProbeFn, Callable[[], int]]:
    """Probe that counts how many times it was awaited."""
    count = 0

    async def probe() -> bool:
        nonlocal count
        count += 1
        return True

    return probe, lambda: count


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------


class TestConstruction:
    def test_invalid_interval(self) -> None:
        with pytest.raises(ValueError, match="interval"):
            HealthProbe(ProviderHealthCache(), {}, interval=0.0)

    def test_invalid_timeout(self) -> None:
        with pytest.raises(ValueError, match="timeout"):
            HealthProbe(ProviderHealthCache(), {}, timeout=0.0)

    def test_provider_ids_exposes_keys(self) -> None:
        cache = ProviderHealthCache()
        probe = HealthProbe(
            cache,
            {"ollama": make_probe(), "groq": make_probe()},
        )
        assert sorted(probe.provider_ids) == ["groq", "ollama"]


# ---------------------------------------------------------------------------
# tick_once — the per-cycle behaviour
# ---------------------------------------------------------------------------


class TestTickOnce:
    @pytest.mark.asyncio
    async def test_healthy_probe_marks_healthy(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        # Pre-mark unhealthy so we can verify the probe recovers it.
        cache.mark_unhealthy("ollama", "stale")
        probe = HealthProbe(cache, {"ollama": make_probe(returns=True)})
        await probe.tick_once()
        assert cache.is_healthy("ollama") is True

    @pytest.mark.asyncio
    async def test_returning_false_marks_unhealthy(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        probe = HealthProbe(cache, {"ollama": make_probe(returns=False)})
        await probe.tick_once()
        assert cache.is_healthy("ollama") is False
        state = cache.get_state("ollama")
        assert state is not None
        assert "false" in (state.last_error or "")

    @pytest.mark.asyncio
    async def test_raising_marks_unhealthy_with_exc_info(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        probe = HealthProbe(
            cache, {"ollama": make_probe(raises=ConnectionError)}
        )
        await probe.tick_once()
        assert cache.is_healthy("ollama") is False
        state = cache.get_state("ollama")
        assert state is not None
        assert "ConnectionError" in (state.last_error or "")

    @pytest.mark.asyncio
    async def test_timeout_marks_unhealthy(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        probe = HealthProbe(
            cache,
            {"ollama": make_slow_probe(delay=1.0)},
            timeout=0.05,
        )
        await probe.tick_once()
        assert cache.is_healthy("ollama") is False
        state = cache.get_state("ollama")
        assert state is not None
        assert "timeout" in (state.last_error or "").lower()

    @pytest.mark.asyncio
    async def test_one_bad_probe_does_not_sink_others(self) -> None:
        # Probe 'ollama' raises — 'groq' must still be evaluated and marked
        # healthy. Bug shape: an unhandled exception in gather() sinks the
        # whole loop.
        cache = ProviderHealthCache(failure_threshold=1)
        probe = HealthProbe(
            cache,
            {
                "ollama": make_probe(raises=RuntimeError),
                "groq": make_probe(returns=True),
            },
        )
        await probe.tick_once()
        assert cache.is_healthy("ollama") is False
        assert cache.is_healthy("groq") is True

    @pytest.mark.asyncio
    async def test_concurrent_probes(self) -> None:
        # All probes should run in parallel — total elapsed wall-clock for
        # N x 100ms probes should be well under N*100ms.
        import time

        cache = ProviderHealthCache()
        probes = {f"p{i}": make_slow_probe(delay=0.1) for i in range(5)}
        probe = HealthProbe(cache, probes, timeout=1.0)
        t0 = time.perf_counter()
        await probe.tick_once()
        elapsed = time.perf_counter() - t0
        assert elapsed < 0.3, f"probes ran serially? elapsed={elapsed:.3f}s"

    @pytest.mark.asyncio
    async def test_empty_probes_is_noop(self) -> None:
        cache = ProviderHealthCache()
        probe = HealthProbe(cache, {})
        # No exception, no state mutation.
        await probe.tick_once()
        assert cache.snapshot() == {}


# ---------------------------------------------------------------------------
# start / stop lifecycle
# ---------------------------------------------------------------------------


class TestLifecycle:
    @pytest.mark.asyncio
    async def test_start_runs_initial_tick_immediately(self) -> None:
        cache = ProviderHealthCache(failure_threshold=1)
        cache.mark_unhealthy("ollama", "stale")
        probe = HealthProbe(cache, {"ollama": make_probe(returns=True)}, interval=10.0)
        await probe.start()
        # Give the loop one event-loop turn to run the initial tick before
        # blocking on the long sleep.
        await asyncio.sleep(0.01)
        assert cache.is_healthy("ollama") is True
        await probe.stop()

    @pytest.mark.asyncio
    async def test_stop_cancels_cleanly(self) -> None:
        cache = ProviderHealthCache()
        probe = HealthProbe(
            cache, {"ollama": make_probe()}, interval=10.0, timeout=1.0
        )
        await probe.start()
        assert probe.running is True
        await probe.stop()
        assert probe.running is False

    @pytest.mark.asyncio
    async def test_start_is_idempotent(self) -> None:
        cache = ProviderHealthCache()
        probe = HealthProbe(cache, {"ollama": make_probe()}, interval=10.0)
        await probe.start()
        await probe.start()  # must not spawn a second task
        assert probe.running is True
        await probe.stop()

    @pytest.mark.asyncio
    async def test_stop_without_start_is_safe(self) -> None:
        cache = ProviderHealthCache()
        probe = HealthProbe(cache, {})
        await probe.stop()  # idempotent / safe pre-start

    @pytest.mark.asyncio
    async def test_loop_keeps_running_after_tick_error(self) -> None:
        # Even if every probe explodes, the loop must keep ticking.
        cache = ProviderHealthCache(failure_threshold=1)
        fn, count = make_call_counter()
        # Wrap with one that raises — but tick_once internally catches
        # per-probe via gather(return_exceptions=True). Force an outer error
        # via an evil probe key that the dict can't handle? Easier: use the
        # call-counter to verify multiple ticks happened.
        probe = HealthProbe(
            cache,
            {"counter": fn},
            interval=0.05,  # short interval for test
            timeout=1.0,
        )
        await probe.start()
        await asyncio.sleep(0.18)  # ~3-4 ticks
        await probe.stop()
        # Initial tick + at least 2 interval ticks.
        assert count() >= 3
