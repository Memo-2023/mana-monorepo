"""
External API Key Validation via mana-core-auth

When EXTERNAL_AUTH_ENABLED=true, API keys are validated against the
central mana-core-auth service. This allows users to create and manage
API keys from the mana.how web interface.

Results are cached for 5 minutes to reduce load on the auth service.
"""

import os
import time
import logging
import httpx
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Configuration
EXTERNAL_AUTH_ENABLED = os.getenv("EXTERNAL_AUTH_ENABLED", "false").lower() == "true"
MANA_CORE_AUTH_URL = os.getenv("MANA_CORE_AUTH_URL", "http://localhost:3001")
API_KEY_CACHE_TTL = int(os.getenv("API_KEY_CACHE_TTL", "300"))  # 5 minutes
EXTERNAL_AUTH_TIMEOUT = float(os.getenv("EXTERNAL_AUTH_TIMEOUT", "5.0"))  # seconds


@dataclass
class ExternalValidationResult:
    """Result from external API key validation."""
    valid: bool
    user_id: Optional[str] = None
    scopes: Optional[list] = None
    rate_limit_requests: int = 60
    rate_limit_window: int = 60
    error: Optional[str] = None
    cached_at: float = 0.0


# In-memory cache for validation results
_validation_cache: dict[str, ExternalValidationResult] = {}


def is_external_auth_enabled() -> bool:
    """Check if external authentication is enabled."""
    return EXTERNAL_AUTH_ENABLED


def _get_cached_result(api_key: str) -> Optional[ExternalValidationResult]:
    """Get cached validation result if still valid."""
    result = _validation_cache.get(api_key)
    if result and (time.time() - result.cached_at) < API_KEY_CACHE_TTL:
        return result
    return None


def _cache_result(api_key: str, result: ExternalValidationResult):
    """Cache a validation result."""
    result.cached_at = time.time()
    _validation_cache[api_key] = result

    # Clean up old entries periodically
    if len(_validation_cache) > 1000:
        now = time.time()
        expired_keys = [
            k for k, v in _validation_cache.items()
            if (now - v.cached_at) >= API_KEY_CACHE_TTL
        ]
        for k in expired_keys:
            del _validation_cache[k]


async def validate_api_key_external(api_key: str, scope: str) -> Optional[ExternalValidationResult]:
    """
    Validate an API key against mana-core-auth service.

    Args:
        api_key: The API key to validate (e.g., "sk_live_...")
        scope: The required scope (e.g., "stt", "tts", "image-gen")

    Returns:
        ExternalValidationResult if external auth is enabled and the key was validated.
        None if external auth is disabled or the service is unavailable (fallback to local).
    """
    if not EXTERNAL_AUTH_ENABLED:
        return None

    # Check cache first
    cached = _get_cached_result(api_key)
    if cached:
        logger.debug(f"Using cached validation result for key prefix: {api_key[:12]}...")
        if cached.valid and cached.scopes and scope not in cached.scopes:
            return ExternalValidationResult(
                valid=False,
                error=f"API key does not have scope: {scope}",
            )
        return cached

    # Call mana-core-auth validation endpoint
    try:
        async with httpx.AsyncClient(timeout=EXTERNAL_AUTH_TIMEOUT) as client:
            response = await client.post(
                f"{MANA_CORE_AUTH_URL}/api/v1/api-keys/validate",
                json={"apiKey": api_key, "scope": scope},
            )

            if response.status_code == 200:
                data = response.json()
                result = ExternalValidationResult(
                    valid=data.get("valid", False),
                    user_id=data.get("userId"),
                    scopes=data.get("scopes", []),
                    rate_limit_requests=data.get("rateLimit", {}).get("requests", 60),
                    rate_limit_window=data.get("rateLimit", {}).get("window", 60),
                    error=data.get("error"),
                )
                _cache_result(api_key, result)
                return result
            else:
                logger.warning(
                    f"External auth returned status {response.status_code}: {response.text}"
                )
                return ExternalValidationResult(
                    valid=False,
                    error=f"Auth service returned {response.status_code}",
                )

    except httpx.TimeoutException:
        logger.warning("External auth service timeout - falling back to local auth")
        return None
    except httpx.ConnectError:
        logger.warning("Cannot connect to external auth service - falling back to local auth")
        return None
    except Exception as e:
        logger.error(f"External auth error: {e}")
        return None


def clear_cache():
    """Clear the validation cache (for testing or runtime updates)."""
    global _validation_cache
    _validation_cache.clear()
    logger.info("External auth cache cleared")
