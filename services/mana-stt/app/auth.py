"""
API Key Authentication for ManaCore STT Service

Simple API key authentication with rate limiting.
Keys are configured via environment variables.

Usage:
    API_KEYS=sk-key1:name1,sk-key2:name2

    Or for unlimited internal access:
    INTERNAL_API_KEY=sk-internal-xxx
"""

import os
import time
import logging
from typing import Optional
from collections import defaultdict
from dataclasses import dataclass, field

from fastapi import HTTPException, Security, Request
from fastapi.security import APIKeyHeader

logger = logging.getLogger(__name__)

# Configuration
API_KEYS_ENV = os.getenv("API_KEYS", "")  # Format: "sk-key1:name1,sk-key2:name2"
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")  # Unlimited internal key
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))  # Per minute
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # Seconds


@dataclass
class APIKey:
    """API Key with metadata."""
    key: str
    name: str
    is_internal: bool = False
    rate_limit: int = RATE_LIMIT_REQUESTS  # Requests per window


@dataclass
class RateLimitInfo:
    """Rate limit tracking per key."""
    requests: list = field(default_factory=list)

    def is_allowed(self, limit: int, window: int) -> bool:
        """Check if request is allowed within rate limit."""
        now = time.time()
        # Remove old requests outside window
        self.requests = [t for t in self.requests if now - t < window]

        if len(self.requests) >= limit:
            return False

        self.requests.append(now)
        return True

    def remaining(self, limit: int, window: int) -> int:
        """Get remaining requests in current window."""
        now = time.time()
        self.requests = [t for t in self.requests if now - t < window]
        return max(0, limit - len(self.requests))


# Parse API keys from environment
def _parse_api_keys() -> dict[str, APIKey]:
    """Parse API keys from environment variables."""
    keys = {}

    # Parse comma-separated keys
    if API_KEYS_ENV:
        for entry in API_KEYS_ENV.split(","):
            entry = entry.strip()
            if ":" in entry:
                key, name = entry.split(":", 1)
            else:
                key, name = entry, "default"
            keys[key.strip()] = APIKey(key=key.strip(), name=name.strip())

    # Add internal key with no rate limit
    if INTERNAL_API_KEY:
        keys[INTERNAL_API_KEY] = APIKey(
            key=INTERNAL_API_KEY,
            name="internal",
            is_internal=True,
            rate_limit=999999,  # Effectively unlimited
        )

    return keys


# Global state
_api_keys = _parse_api_keys()
_rate_limits: dict[str, RateLimitInfo] = defaultdict(RateLimitInfo)

# Security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


@dataclass
class AuthResult:
    """Result of authentication check."""
    authenticated: bool
    key_name: Optional[str] = None
    is_internal: bool = False
    rate_limit_remaining: Optional[int] = None


async def verify_api_key(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
) -> AuthResult:
    """
    Verify API key and check rate limits.

    Returns AuthResult with authentication status.
    Raises HTTPException if auth fails or rate limited.
    """
    # Skip auth for health and docs endpoints
    path = request.url.path
    if path in ["/health", "/docs", "/openapi.json", "/redoc"]:
        return AuthResult(authenticated=True, key_name="public")

    # If auth not required, allow all
    if not REQUIRE_AUTH:
        return AuthResult(authenticated=True, key_name="anonymous")

    # Check for API key
    if not api_key:
        logger.warning(f"Missing API key for {path} from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Provide X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Validate key
    if api_key not in _api_keys:
        logger.warning(f"Invalid API key attempt for {path}")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    key_info = _api_keys[api_key]

    # Check rate limit (skip for internal keys)
    if not key_info.is_internal:
        rate_info = _rate_limits[api_key]
        if not rate_info.is_allowed(key_info.rate_limit, RATE_LIMIT_WINDOW):
            remaining = rate_info.remaining(key_info.rate_limit, RATE_LIMIT_WINDOW)
            logger.warning(f"Rate limit exceeded for key '{key_info.name}'")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {RATE_LIMIT_WINDOW} seconds.",
                headers={
                    "X-RateLimit-Limit": str(key_info.rate_limit),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(int(time.time()) + RATE_LIMIT_WINDOW),
                    "Retry-After": str(RATE_LIMIT_WINDOW),
                },
            )
        remaining = rate_info.remaining(key_info.rate_limit, RATE_LIMIT_WINDOW)
    else:
        remaining = None

    logger.debug(f"Authenticated request from '{key_info.name}' to {path}")

    return AuthResult(
        authenticated=True,
        key_name=key_info.name,
        is_internal=key_info.is_internal,
        rate_limit_remaining=remaining,
    )


def get_api_key_stats() -> dict:
    """Get statistics about API keys (for admin endpoint)."""
    stats = {
        "total_keys": len(_api_keys),
        "auth_required": REQUIRE_AUTH,
        "rate_limit": {
            "requests_per_window": RATE_LIMIT_REQUESTS,
            "window_seconds": RATE_LIMIT_WINDOW,
        },
        "keys": [],
    }

    for key, info in _api_keys.items():
        # Don't expose actual keys, just metadata
        masked_key = key[:8] + "..." if len(key) > 8 else "***"
        rate_info = _rate_limits.get(key, RateLimitInfo())
        stats["keys"].append({
            "name": info.name,
            "key_prefix": masked_key,
            "is_internal": info.is_internal,
            "requests_in_window": len(rate_info.requests),
            "remaining": rate_info.remaining(info.rate_limit, RATE_LIMIT_WINDOW),
        })

    return stats


def reload_api_keys():
    """Reload API keys from environment (for runtime updates)."""
    global _api_keys
    _api_keys = _parse_api_keys()
    logger.info(f"Reloaded {len(_api_keys)} API keys")
