"""
External API Key Validation — delegates to shared manacore_auth package.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages", "shared-python"))

from manacore_auth.external_auth import (
    ExternalValidationResult,
    is_external_auth_enabled,
    validate_api_key_external,
    clear_cache,
)

__all__ = [
    "ExternalValidationResult",
    "is_external_auth_enabled",
    "validate_api_key_external",
    "clear_cache",
]
