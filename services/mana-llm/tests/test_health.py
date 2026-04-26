"""Tests for the provider health cache."""

from __future__ import annotations

import pytest

from src.health import (
    DEFAULT_FAILURE_THRESHOLD,
    DEFAULT_UNHEALTHY_BACKOFF_SEC,
    ProviderHealthCache,
    ProviderState,
)


class FakeClock:
    """Deterministic clock for circuit-breaker timing tests."""

    def __init__(self, start: float = 1_000_000.0) -> None:
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------


class TestConstruction:
    def test_defaults(self) -> None:
        c = ProviderHealthCache()
        assert c.failure_threshold == DEFAULT_FAILURE_THRESHOLD
        assert c.unhealthy_backoff_sec == DEFAULT_UNHEALTHY_BACKOFF_SEC

    def test_invalid_threshold_rejected(self) -> None:
        with pytest.raises(ValueError, match="failure_threshold"):
            ProviderHealthCache(failure_threshold=0)

    def test_invalid_backoff_rejected(self) -> None:
        with pytest.raises(ValueError, match="backoff"):
            ProviderHealthCache(unhealthy_backoff_sec=-1.0)


# ---------------------------------------------------------------------------
# Default-healthy behaviour
# ---------------------------------------------------------------------------


class TestDefaults:
    def test_unknown_provider_is_healthy(self) -> None:
        # The cache is observation-only — no entry means "no reason to skip".
        c = ProviderHealthCache()
        assert c.is_healthy("ollama") is True

    def test_unknown_provider_has_no_state(self) -> None:
        c = ProviderHealthCache()
        assert c.get_state("ollama") is None

    def test_snapshot_includes_expected_zero_state(self) -> None:
        c = ProviderHealthCache()
        snap = c.snapshot(expected=["ollama", "groq"])
        assert set(snap.keys()) == {"ollama", "groq"}
        assert all(s.healthy for s in snap.values())
        assert all(s.consecutive_failures == 0 for s in snap.values())


# ---------------------------------------------------------------------------
# Failure → unhealthy state machine
# ---------------------------------------------------------------------------


class TestFailureSemantics:
    def test_first_failure_does_not_trip(self) -> None:
        # Single transient blips shouldn't bounce a provider — wait for the
        # next consecutive failure to confirm.
        c = ProviderHealthCache(failure_threshold=2)
        c.mark_unhealthy("ollama", "boom")
        assert c.is_healthy("ollama") is True
        state = c.get_state("ollama")
        assert state is not None
        assert state.consecutive_failures == 1
        assert state.healthy is True

    def test_threshold_reached_trips_breaker(self) -> None:
        clock = FakeClock()
        c = ProviderHealthCache(
            failure_threshold=2,
            unhealthy_backoff_sec=60.0,
            clock=clock,
        )
        c.mark_unhealthy("ollama", "fail-1")
        c.mark_unhealthy("ollama", "fail-2")
        assert c.is_healthy("ollama") is False
        state = c.get_state("ollama")
        assert state is not None
        assert state.healthy is False
        assert state.last_error == "fail-2"
        assert state.unhealthy_until == clock.now + 60.0

    def test_threshold_one_trips_immediately(self) -> None:
        c = ProviderHealthCache(failure_threshold=1)
        c.mark_unhealthy("ollama", "boom")
        assert c.is_healthy("ollama") is False

    def test_mark_healthy_clears_state(self) -> None:
        c = ProviderHealthCache(failure_threshold=2)
        c.mark_unhealthy("ollama", "x")
        c.mark_unhealthy("ollama", "x")
        assert c.is_healthy("ollama") is False
        c.mark_healthy("ollama")
        assert c.is_healthy("ollama") is True
        state = c.get_state("ollama")
        assert state is not None
        assert state.healthy is True
        assert state.consecutive_failures == 0
        assert state.unhealthy_until == 0.0
        assert state.last_error is None


class TestBackoffWindow:
    def test_is_healthy_false_during_backoff(self) -> None:
        clock = FakeClock()
        c = ProviderHealthCache(failure_threshold=1, unhealthy_backoff_sec=60.0, clock=clock)
        c.mark_unhealthy("ollama", "boom")
        assert c.is_healthy("ollama") is False
        clock.advance(30.0)
        assert c.is_healthy("ollama") is False

    def test_is_healthy_true_after_backoff_expires(self) -> None:
        # After backoff: half-open. Router gets one more attempt; success
        # mark_healthy resets, failure mark_unhealthy re-arms backoff.
        clock = FakeClock()
        c = ProviderHealthCache(failure_threshold=1, unhealthy_backoff_sec=60.0, clock=clock)
        c.mark_unhealthy("ollama", "boom")
        clock.advance(61.0)
        assert c.is_healthy("ollama") is True

    def test_failure_during_backoff_extends_window(self) -> None:
        clock = FakeClock()
        c = ProviderHealthCache(failure_threshold=1, unhealthy_backoff_sec=60.0, clock=clock)
        c.mark_unhealthy("ollama", "first")
        original_until = c.get_state("ollama").unhealthy_until
        clock.advance(20.0)
        c.mark_unhealthy("ollama", "second")
        new_until = c.get_state("ollama").unhealthy_until
        assert new_until > original_until
        assert new_until == clock.now + 60.0

    def test_recovery_logged_only_once(self, caplog: pytest.LogCaptureFixture) -> None:
        clock = FakeClock()
        c = ProviderHealthCache(failure_threshold=1, unhealthy_backoff_sec=60.0, clock=clock)
        c.mark_unhealthy("ollama", "boom")
        with caplog.at_level("INFO"):
            c.mark_healthy("ollama")
            # Calling mark_healthy on an already-healthy provider must not
            # spam the recovery log line.
            c.mark_healthy("ollama")
            c.mark_healthy("ollama")
        recovery_lines = [r for r in caplog.records if "recovered" in r.message]
        assert len(recovery_lines) == 1


# ---------------------------------------------------------------------------
# Snapshot shape
# ---------------------------------------------------------------------------


class TestSnapshot:
    def test_snapshot_returns_copies(self) -> None:
        # Caller shouldn't be able to poke through to the cache's internal
        # state via a snapshot reference.
        c = ProviderHealthCache(failure_threshold=1)
        c.mark_unhealthy("ollama", "x")
        snap = c.snapshot()
        snap["ollama"].healthy = True
        # Original state untouched:
        assert c.is_healthy("ollama") is False

    def test_snapshot_matches_recorded_state(self) -> None:
        clock = FakeClock()
        c = ProviderHealthCache(
            failure_threshold=2,
            unhealthy_backoff_sec=60.0,
            clock=clock,
        )
        c.mark_unhealthy("groq", "rate-limit")
        snap = c.snapshot()
        assert isinstance(snap["groq"], ProviderState)
        assert snap["groq"].consecutive_failures == 1
        assert snap["groq"].last_error == "rate-limit"
        assert snap["groq"].last_check == clock.now

    def test_snapshot_expected_does_not_overwrite_real_state(self) -> None:
        c = ProviderHealthCache(failure_threshold=1)
        c.mark_unhealthy("ollama", "real-boom")
        snap = c.snapshot(expected=["ollama", "groq"])
        # ollama keeps its real (unhealthy) state, groq gets the zero-default.
        assert snap["ollama"].consecutive_failures == 1
        assert snap["groq"].consecutive_failures == 0
