"""
API Key Authentication for Mana STT Service.
Delegates to shared mana_auth package.
"""

# Re-export everything from shared auth for backward compatibility
import sys
import os

# Add shared-python to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages", "shared-python"))

from mana_auth import (
    APIKey,
    AuthResult,
    RateLimitInfo,
    verify_api_key as _verify_api_key,
    get_api_key_stats,
    reload_api_keys,
    api_key_header,
    create_auth_dependency,
)
from mana_auth.external_auth import (
    ExternalValidationResult,
    is_external_auth_enabled,
    validate_api_key_external,
)

from typing import Optional
from fastapi import Security, Request

# STT-specific auth dependency
verify_stt_key = create_auth_dependency("stt")


async def verify_api_key(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
) -> AuthResult:
    """Verify API key with STT scope."""
    return await _verify_api_key(request, scope="stt", api_key=api_key)
