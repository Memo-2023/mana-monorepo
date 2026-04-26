"""Background probe loop that keeps :class:`ProviderHealthCache` fresh.

The router's circuit-breaker is reactive — it only learns a provider is
sick after the next live request fails. A reactive-only design means:

* every cold start re-discovers Ollama is down by paying one 75-second
  ``ConnectError``, and
* a provider that quietly recovers stays marked unhealthy until its
  backoff expires and someone tries it.

The probe loop closes both gaps. Every ``interval`` seconds it pings
each registered provider with a small known-cheap request (Ollama:
``GET /api/tags``, OpenAI-compat: ``GET /v1/models``) and updates the
cache. Probes run concurrently per tick and respect a hard
``probe_timeout`` so a hanging provider can't stall the loop.

Probe functions are injected from outside (``probes={name: async-fn}``)
so this module stays decoupled from the provider classes — wiring lives
in ``main.py`` where we already know which providers are configured.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Awaitable, Callable

from .health import ProviderHealthCache

logger = logging.getLogger(__name__)

#: Probe function: returns ``True`` for healthy. Raising or returning
#: ``False`` both count as a failure (the loop just calls
#: ``mark_unhealthy``); an exception's string form becomes the
#: ``last_error`` for the snapshot endpoint.
ProbeFn = Callable[[], Awaitable[bool]]

DEFAULT_PROBE_INTERVAL_SEC = 30.0
DEFAULT_PROBE_TIMEOUT_SEC = 3.0


class HealthProbe:
    """Periodically probes every registered provider and updates the cache.

    Lifecycle::

        probe = HealthProbe(cache, {"ollama": probe_ollama, ...})
        await probe.start()        # spawns the background task
        ...
        await probe.stop()         # cancels and awaits cleanup

    Tests typically call :meth:`tick_once` directly to exercise one cycle
    without driving the asyncio scheduler through real ``asyncio.sleep``.
    """

    def __init__(
        self,
        cache: ProviderHealthCache,
        probes: dict[str, ProbeFn],
        *,
        interval: float = DEFAULT_PROBE_INTERVAL_SEC,
        timeout: float = DEFAULT_PROBE_TIMEOUT_SEC,
    ) -> None:
        if interval <= 0:
            raise ValueError("interval must be > 0")
        if timeout <= 0:
            raise ValueError("timeout must be > 0")
        self._cache = cache
        self._probes = dict(probes)
        self._interval = interval
        self._timeout = timeout
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    @property
    def interval(self) -> float:
        return self._interval

    @property
    def timeout(self) -> float:
        return self._timeout

    @property
    def provider_ids(self) -> list[str]:
        return list(self._probes)

    @property
    def running(self) -> bool:
        return self._task is not None and not self._task.done()

    # ------------------------------------------------------------------
    # Per-tick logic — exercised directly by tests
    # ------------------------------------------------------------------

    async def tick_once(self) -> None:
        """Probe every provider once, in parallel, updating the cache.

        Errors in any one probe (including ``asyncio.TimeoutError``) are
        captured per-provider — one bad probe never sinks the loop.
        """
        if not self._probes:
            return
        results = await asyncio.gather(
            *(self._probe_one(name, fn) for name, fn in self._probes.items()),
            return_exceptions=True,
        )
        # gather(return_exceptions=True) caught everything per-probe; this
        # branch should never fire, but guard in case _probe_one ever grows
        # a code path that bypasses its try/except.
        # asyncio.gather() returns results in input order and same length,
        # so the zip is a 1:1 mapping back to provider names.
        for name, result in zip(self._probes, results):
            if isinstance(result, BaseException):
                logger.error("probe %s leaked exception: %s", name, result)

    async def _probe_one(self, name: str, fn: ProbeFn) -> None:
        try:
            healthy = await asyncio.wait_for(fn(), timeout=self._timeout)
        except asyncio.TimeoutError:
            self._cache.mark_unhealthy(name, f"probe-timeout (>{self._timeout:.0f}s)")
            return
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001 — probe SHOULD be permissive
            self._cache.mark_unhealthy(name, f"probe-exception: {type(e).__name__}: {e}")
            return
        if healthy:
            self._cache.mark_healthy(name)
        else:
            self._cache.mark_unhealthy(name, "probe-returned-false")

    # ------------------------------------------------------------------
    # Long-running task management
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Spawn the periodic probe task. Idempotent."""
        if self.running:
            return
        self._stop.clear()
        self._task = asyncio.create_task(self._run_forever(), name="mana-llm-health-probe")
        logger.info(
            "HealthProbe started (interval=%.0fs, timeout=%.0fs, providers=%s)",
            self._interval,
            self._timeout,
            ", ".join(self._probes) or "<none>",
        )

    async def stop(self) -> None:
        """Cancel the background task and wait for it to finish."""
        if not self.running:
            return
        self._stop.set()
        assert self._task is not None
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        finally:
            self._task = None
        logger.info("HealthProbe stopped")

    async def _run_forever(self) -> None:
        # Probe immediately at boot so we don't serve traffic for `interval`
        # seconds based on optimistic-default assumptions.
        try:
            await self.tick_once()
        except Exception as e:  # noqa: BLE001
            logger.error("HealthProbe initial tick failed: %s", e)
        while not self._stop.is_set():
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=self._interval)
            except asyncio.TimeoutError:
                pass
            else:
                # _stop.wait() succeeded → stop signalled, exit.
                return
            try:
                await self.tick_once()
            except Exception as e:  # noqa: BLE001
                logger.error("HealthProbe tick failed: %s", e)


# ---------------------------------------------------------------------------
# Probe-function helpers
# ---------------------------------------------------------------------------


def make_http_probe(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    expected_status_lt: int = 500,
) -> ProbeFn:
    """Return a probe function that does ``GET <url>`` and considers the
    provider healthy iff the response status is below
    ``expected_status_lt`` (default: any non-5xx counts).

    A 401/403/404 still counts as healthy because the *server* answered —
    auth or path mistakes are misconfiguration, not provider liveness.
    """
    import httpx

    async def probe() -> bool:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(url, headers=headers or None)
            return resp.status_code < expected_status_lt

    return probe
