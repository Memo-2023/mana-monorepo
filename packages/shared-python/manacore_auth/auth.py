"""
API Key Authentication for Mana Python Services

Supports two authentication modes:
1. Local API keys: Configured via environment variables
2. External API keys: Validated via mana-auth service (when EXTERNAL_AUTH_ENABLED=true)

Usage:
    API_KEYS=sk-key1:name1,sk-key2:name2
    INTERNAL_API_KEY=sk-internal-xxx
    EXTERNAL_AUTH_ENABLED=true
    MANA_AUTH_URL=http://localhost:3001
"""

import os
import time
import logging
from typing import Optional
from collections import defaultdict
from dataclasses import dataclass, field
from functools import partial

from fastapi import HTTPException, Security, Request, Depends
from fastapi.security import APIKeyHeader

from .external_auth import (
    is_external_auth_enabled,
    validate_api_key_external,
)

logger = logging.getLogger(__name__)

# Configuration
API_KEYS_ENV = os.getenv("API_KEYS", "")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))


@dataclass
class APIKey:
    """API Key with metadata."""
    key: str
    name: str
    is_internal: bool = False
    rate_limit: int = RATE_LIMIT_REQUESTS


@dataclass
class RateLimitInfo:
    """Rate limit tracking per key."""
    requests: list = field(default_factory=list)

    def is_allowed(self, limit: int, window: int) -> bool:
        now = time.time()
        self.requests = [t for t in self.requests if now - t < window]
        if len(self.requests) >= limit:
            return False
        self.requests.append(now)
        return True

    def remaining(self, limit: int, window: int) -> int:
        now = time.time()
        self.requests = [t for t in self.requests if now - t < window]
        return max(0, limit - len(self.requests))


def _parse_api_keys() -> dict[str, APIKey]:
    """Parse API keys from environment variables."""
    keys = {}
    if API_KEYS_ENV:
        for entry in API_KEYS_ENV.split(","):
            entry = entry.strip()
            if ":" in entry:
                key, name = entry.split(":", 1)
            else:
                key, name = entry, "default"
            keys[key.strip()] = APIKey(key=key.strip(), name=name.strip())

    if INTERNAL_API_KEY:
        keys[INTERNAL_API_KEY] = APIKey(
            key=INTERNAL_API_KEY, name="internal", is_internal=True, rate_limit=999999,
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
    user_id: Optional[str] = None


async def verify_api_key(
    request: Request,
    scope: str = "default",
    api_key: Optional[str] = Security(api_key_header),
) -> AuthResult:
    """
    Verify API key and check rate limits.

    Args:
        request: The incoming HTTP request.
        scope: The service scope for external auth (e.g., "stt", "tts").
        api_key: The API key from X-API-Key header.

    Returns AuthResult with authentication status.
    Raises HTTPException if auth fails or rate limited.
    """
    path = request.url.path
    if path in ["/health", "/docs", "/openapi.json", "/redoc"]:
        return AuthResult(authenticated=True, key_name="public")

    if not REQUIRE_AUTH:
        return AuthResult(authenticated=True, key_name="anonymous")

    if not api_key:
        logger.warning(f"Missing API key for {path} from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Provide X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Try external auth first for sk_live_ keys
    if api_key.startswith("sk_live_") and is_external_auth_enabled():
        external_result = await validate_api_key_external(api_key, scope)

        if external_result is not None:
            if external_result.valid:
                rate_info = _rate_limits[api_key]
                limit = external_result.rate_limit_requests
                window = external_result.rate_limit_window

                if not rate_info.is_allowed(limit, window):
                    remaining = rate_info.remaining(limit, window)
                    raise HTTPException(
                        status_code=429,
                        detail=f"Rate limit exceeded. Try again in {window} seconds.",
                        headers={
                            "X-RateLimit-Limit": str(limit),
                            "X-RateLimit-Remaining": str(remaining),
                            "X-RateLimit-Reset": str(int(time.time()) + window),
                            "Retry-After": str(window),
                        },
                    )

                remaining = rate_info.remaining(limit, window)
                return AuthResult(
                    authenticated=True, key_name="external", is_internal=False,
                    rate_limit_remaining=remaining, user_id=external_result.user_id,
                )
            else:
                raise HTTPException(
                    status_code=401,
                    detail=external_result.error or "Invalid API key.",
                    headers={"WWW-Authenticate": "ApiKey"},
                )

    # Local auth
    if api_key not in _api_keys:
        logger.warning(f"Invalid API key attempt for {path}")
        raise HTTPException(
            status_code=401, detail="Invalid API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    key_info = _api_keys[api_key]

    if not key_info.is_internal:
        rate_info = _rate_limits[api_key]
        if not rate_info.is_allowed(key_info.rate_limit, RATE_LIMIT_WINDOW):
            remaining = rate_info.remaining(key_info.rate_limit, RATE_LIMIT_WINDOW)
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

    return AuthResult(
        authenticated=True, key_name=key_info.name,
        is_internal=key_info.is_internal, rate_limit_remaining=remaining,
    )


def create_auth_dependency(scope: str):
    """
    Create a FastAPI dependency for API key auth with a specific scope.

    Usage:
        auth_dep = create_auth_dependency("stt")

        @app.post("/transcribe")
        async def transcribe(auth: AuthResult = Depends(auth_dep)):
            ...
    """
    async def _dep(
        request: Request,
        api_key: Optional[str] = Security(api_key_header),
    ) -> AuthResult:
        return await verify_api_key(request, scope=scope, api_key=api_key)
    return _dep


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
