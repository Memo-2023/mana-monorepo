"""Prometheus metrics for mana-llm."""

import time
from collections.abc import Callable

from fastapi import Request, Response
from prometheus_client import Counter, Gauge, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware

# Request metrics
REQUEST_COUNT = Counter(
    "mana_llm_requests_total",
    "Total number of requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "mana_llm_request_latency_seconds",
    "Request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0],
)

# LLM-specific metrics
LLM_REQUEST_COUNT = Counter(
    "mana_llm_llm_requests_total",
    "Total number of LLM requests",
    ["provider", "model", "streaming"],
)

LLM_TOKEN_COUNT = Counter(
    "mana_llm_tokens_total",
    "Total tokens processed",
    ["provider", "model", "type"],  # type: prompt, completion
)

LLM_LATENCY = Histogram(
    "mana_llm_llm_latency_seconds",
    "LLM request latency in seconds",
    ["provider", "model"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0],
)

LLM_ERRORS = Counter(
    "mana_llm_llm_errors_total",
    "Total LLM errors",
    ["provider", "model", "error_type"],
)

# ---------------------------------------------------------------------------
# Alias / fallback / health metrics — added in M4 of llm-fallback-aliases.md.
# ---------------------------------------------------------------------------

ALIAS_RESOLVED = Counter(
    "mana_llm_alias_resolved_total",
    "How often an alias resolved to a concrete provider/model. The `target` "
    "label is the chain entry that actually served the request — useful for "
    "spotting cases where the primary always falls through to a cloud entry.",
    ["alias", "target"],
)

FALLBACK_TRIGGERED = Counter(
    "mana_llm_fallback_total",
    "Fallback transitions: a chain entry failed (or was skipped via cache) "
    "and the router moved to the next entry. `reason` is the exception class "
    "name or `cache-unhealthy` / `unconfigured`. `from_model` is the entry "
    "that didn't serve, `to_model` is empty when no further entries existed.",
    ["from_model", "to_model", "reason"],
)

PROVIDER_HEALTHY = Gauge(
    "mana_llm_provider_healthy",
    "1 when the provider is currently considered healthy by the cache, "
    "0 when in backoff. Refreshed on every probe tick and on every router "
    "call-site state transition.",
    ["provider"],
)


def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting HTTP metrics."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        response = await call_next(request)

        # Record metrics
        duration = time.time() - start_time
        endpoint = request.url.path
        method = request.method
        status = str(response.status_code)

        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

        return response


# Export middleware instance
metrics_middleware = MetricsMiddleware


def record_llm_request(
    provider: str,
    model: str,
    streaming: bool,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    latency: float | None = None,
) -> None:
    """Record LLM request metrics."""
    LLM_REQUEST_COUNT.labels(
        provider=provider,
        model=model,
        streaming=str(streaming).lower(),
    ).inc()

    if prompt_tokens > 0:
        LLM_TOKEN_COUNT.labels(provider=provider, model=model, type="prompt").inc(prompt_tokens)

    if completion_tokens > 0:
        LLM_TOKEN_COUNT.labels(provider=provider, model=model, type="completion").inc(
            completion_tokens
        )

    if latency is not None:
        LLM_LATENCY.labels(provider=provider, model=model).observe(latency)


def record_llm_error(provider: str, model: str, error_type: str) -> None:
    """Record LLM error metrics."""
    LLM_ERRORS.labels(provider=provider, model=model, error_type=error_type).inc()


def record_alias_resolved(alias: str, target: str) -> None:
    """Record which concrete model an alias resolved to for this request."""
    ALIAS_RESOLVED.labels(alias=alias, target=target).inc()


def record_fallback(from_model: str, to_model: str, reason: str) -> None:
    """Record a fallback transition. ``to_model`` is empty when the chain
    ran out (i.e. NoHealthyProviderError)."""
    FALLBACK_TRIGGERED.labels(
        from_model=from_model,
        to_model=to_model,
        reason=reason,
    ).inc()


def set_provider_healthy(provider: str, healthy: bool) -> None:
    """Mirror ``ProviderHealthCache`` state into a Prometheus gauge."""
    PROVIDER_HEALTHY.labels(provider=provider).set(1.0 if healthy else 0.0)
