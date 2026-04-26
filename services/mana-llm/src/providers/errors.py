"""Structured provider errors.

These map to distinct HTTP status codes and metric labels so callers can
distinguish between "model refused to answer" (blocked), "hit the token
budget" (truncated), "auth is broken", "we were rate-limited", and
"model doesn't support what we asked" (capability). The old behaviour of
returning an empty-string response on content-filter hits silently
corrupts downstream pipelines (e.g. the planner sees "" and reports
"no JSON block found" — misleading).
"""


class ProviderError(Exception):
    """Base class for structured provider errors."""

    # Short stable identifier used in metrics and API responses.
    kind: str = "unknown"
    # Suggested HTTP status when this error bubbles out of an endpoint.
    http_status: int = 502


class ProviderBlockedError(ProviderError):
    """The provider refused to return content (safety, recitation, …).

    The model produced nothing usable because a content filter or policy
    guardrail fired. Retry with the same inputs will fail again — the
    caller needs to adjust the prompt or give the user a clear message.
    """

    kind = "blocked"
    http_status = 422

    def __init__(self, reason: str, detail: str | None = None):
        self.reason = reason  # e.g. "SAFETY", "RECITATION"
        self.detail = detail
        msg = f"Provider blocked the response ({reason})"
        if detail:
            msg += f": {detail}"
        super().__init__(msg)


class ProviderTruncatedError(ProviderError):
    """The response was cut off before completion (hit max_tokens)."""

    kind = "truncated"
    http_status = 502

    def __init__(self, partial_text: str | None = None):
        self.partial_text = partial_text
        super().__init__(
            "Provider truncated the response (max_tokens reached) — "
            "re-run with a higher max_tokens or smaller input"
        )


class ProviderAuthError(ProviderError):
    """Authentication against the upstream provider failed."""

    kind = "auth"
    http_status = 502  # not 401 — the client's auth is fine, *ours* isn't


class ProviderRateLimitError(ProviderError):
    """The upstream provider rate-limited us."""

    kind = "rate_limit"
    http_status = 429


class ProviderCapabilityError(ProviderError):
    """The requested feature is not supported by the chosen model.

    Typically raised when a request asks for native tool-calling against
    a model that does not support it. We refuse to silently degrade.
    """

    kind = "capability"
    http_status = 400


class NoHealthyProviderError(ProviderError):
    """Every entry in the resolved chain has been tried and either was
    unconfigured, marked unhealthy by the cache, or failed in flight.

    Carries the full attempt log so the caller can see which providers
    were tried and why each one was skipped or failed — invaluable when
    a real outage hits and the API returns 503 instead of the usual 200.
    """

    kind = "no_healthy_provider"
    http_status = 503

    def __init__(
        self,
        model_or_alias: str,
        attempts: list[tuple[str, str]],
        last_exception: Exception | None = None,
    ) -> None:
        self.model_or_alias = model_or_alias
        self.attempts = list(attempts)
        self.last_exception = last_exception
        if attempts:
            attempt_log = ", ".join(f"{model}={reason}" for model, reason in attempts)
        else:
            attempt_log = "(no providers in resolved chain were configured)"
        msg = (
            f"no healthy provider could serve {model_or_alias!r}. Attempts: {attempt_log}"
        )
        if last_exception is not None:
            msg += f". Last error: {type(last_exception).__name__}: {last_exception}"
        super().__init__(msg)
