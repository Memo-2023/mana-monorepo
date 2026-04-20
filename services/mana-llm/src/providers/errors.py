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
