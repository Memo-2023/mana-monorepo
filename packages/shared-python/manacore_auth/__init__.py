"""
ManaCore Shared Auth — API Key authentication for Python microservices.

Supports two authentication modes:
1. Local API keys: Configured via environment variables
2. External API keys: Validated via mana-core-auth service (when EXTERNAL_AUTH_ENABLED=true)

Usage:
    from manacore_auth import verify_api_key, AuthResult, get_api_key_stats

    # In FastAPI:
    @app.post("/transcribe")
    async def transcribe(auth: AuthResult = Depends(create_auth_dependency("stt"))):
        ...
"""

from .auth import (
    APIKey,
    AuthResult,
    RateLimitInfo,
    verify_api_key,
    get_api_key_stats,
    reload_api_keys,
    api_key_header,
    create_auth_dependency,
)
from .external_auth import (
    ExternalValidationResult,
    is_external_auth_enabled,
    validate_api_key_external,
    clear_cache,
)

__all__ = [
    "APIKey",
    "AuthResult",
    "RateLimitInfo",
    "verify_api_key",
    "get_api_key_stats",
    "reload_api_keys",
    "api_key_header",
    "create_auth_dependency",
    "ExternalValidationResult",
    "is_external_auth_enabled",
    "validate_api_key_external",
    "clear_cache",
]
