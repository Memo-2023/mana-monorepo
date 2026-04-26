"""Provider health cache.

Tracks per-provider liveness for the LLM router. The router reads
:meth:`is_healthy` to decide whether to even try a provider in a chain;
the probe loop and the call-site fallback handler write state via
:meth:`mark_healthy` / :meth:`mark_unhealthy`.

Implements a simple circuit-breaker:

* The first failure flips no switch — providers occasionally have
  transient blips, we don't want to bounce off after a single 502.
* After ``failure_threshold`` consecutive failures the provider is
  marked unhealthy for ``unhealthy_backoff`` seconds. During that
  window :meth:`is_healthy` returns ``False`` so the router fails
  fast straight to the next chain entry.
* When the backoff expires :meth:`is_healthy` returns ``True`` again
  (half-open). The next call exercises the provider; success calls
  :meth:`mark_healthy` and fully resets state, failure re-arms the
  backoff window.

State is kept in a plain dict guarded by a ``threading.Lock``. All
operations are short, lock-free reads of dict references aren't safe
because we mutate state in-place — the lock keeps it boring. Probe
loop runs in the asyncio loop alongside the router, but the lock
costs are negligible at ~1 update/30s/provider.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Iterable

logger = logging.getLogger(__name__)

DEFAULT_FAILURE_THRESHOLD = 2
DEFAULT_UNHEALTHY_BACKOFF_SEC = 60.0


@dataclass
class ProviderState:
    """Per-provider liveness snapshot. All times are unix seconds."""

    healthy: bool = True
    consecutive_failures: int = 0
    last_check: float = 0.0
    last_error: str | None = None
    unhealthy_until: float = 0.0
    """When > now, the provider is currently in backoff (`is_healthy → False`)."""


class ProviderHealthCache:
    """Thread-safe per-provider liveness with circuit-breaker semantics.

    Provider IDs are arbitrary strings — by convention we use the same
    short name as the provider router (``ollama``, ``groq``, ``openrouter``,
    ``together``, ``google``). The cache is provider-list agnostic; states
    are created lazily on first ``mark_*`` or queried-but-absent ``is_healthy``
    call (returning ``True`` by default — no state means no reason to skip).
    """

    def __init__(
        self,
        *,
        failure_threshold: int = DEFAULT_FAILURE_THRESHOLD,
        unhealthy_backoff_sec: float = DEFAULT_UNHEALTHY_BACKOFF_SEC,
        clock: callable = time.time,
    ) -> None:
        if failure_threshold < 1:
            raise ValueError("failure_threshold must be >= 1")
        if unhealthy_backoff_sec < 0:
            raise ValueError("unhealthy_backoff_sec must be >= 0")
        self._failure_threshold = failure_threshold
        self._unhealthy_backoff = unhealthy_backoff_sec
        self._clock = clock
        self._lock = threading.Lock()
        self._states: dict[str, ProviderState] = {}

    @property
    def failure_threshold(self) -> int:
        return self._failure_threshold

    @property
    def unhealthy_backoff_sec(self) -> float:
        return self._unhealthy_backoff

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    def is_healthy(self, provider_id: str) -> bool:
        """Should the router try this provider right now?

        Returns ``True`` by default for unknown providers — the cache is
        observation-only, not a registry.
        """
        with self._lock:
            state = self._states.get(provider_id)
            if state is None:
                return True
            if state.unhealthy_until > self._clock():
                return False
            # Backoff expired: caller is allowed to try again (half-open).
            return True

    def get_state(self, provider_id: str) -> ProviderState | None:
        """Snapshot of one provider's state (for debugging / tests)."""
        with self._lock:
            state = self._states.get(provider_id)
            return None if state is None else _copy(state)

    def snapshot(self, expected: Iterable[str] | None = None) -> dict[str, ProviderState]:
        """All known states, plus zero-state placeholders for any names in
        ``expected`` that haven't been touched yet. Used by ``GET /v1/health``
        so the response shape is stable regardless of probe order.
        """
        with self._lock:
            out = {pid: _copy(s) for pid, s in self._states.items()}
        if expected:
            for pid in expected:
                out.setdefault(pid, ProviderState())
        return out

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    def mark_healthy(self, provider_id: str) -> None:
        """Provider answered correctly — clear any failure state."""
        with self._lock:
            state = self._states.setdefault(provider_id, ProviderState())
            previously_unhealthy = not state.healthy
            state.healthy = True
            state.consecutive_failures = 0
            state.last_check = self._clock()
            state.last_error = None
            state.unhealthy_until = 0.0
            if previously_unhealthy:
                logger.info("provider %s recovered", provider_id)

    def mark_unhealthy(self, provider_id: str, reason: str) -> None:
        """Record a failure. Trips the breaker after the threshold."""
        with self._lock:
            state = self._states.setdefault(provider_id, ProviderState())
            state.consecutive_failures += 1
            state.last_check = self._clock()
            state.last_error = reason
            tripped = state.consecutive_failures >= self._failure_threshold
            if tripped and state.healthy:
                state.healthy = False
                state.unhealthy_until = self._clock() + self._unhealthy_backoff
                logger.warning(
                    "provider %s marked unhealthy after %d consecutive failures (%s); "
                    "backoff %.0fs",
                    provider_id,
                    state.consecutive_failures,
                    reason,
                    self._unhealthy_backoff,
                )
            elif not state.healthy:
                # Still in unhealthy window; refresh the backoff so a flapping
                # provider doesn't get re-tried every probe tick.
                state.unhealthy_until = self._clock() + self._unhealthy_backoff


def _copy(state: ProviderState) -> ProviderState:
    """Return a shallow copy so callers can read without holding the lock."""
    return ProviderState(
        healthy=state.healthy,
        consecutive_failures=state.consecutive_failures,
        last_check=state.last_check,
        last_error=state.last_error,
        unhealthy_until=state.unhealthy_until,
    )
