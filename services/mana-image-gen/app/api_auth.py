"""
Simple API Key Authentication Middleware for GPU Services.

Checks X-API-Key header or ?api_key query parameter.
Skips auth for /health, /docs, /openapi.json, /redoc endpoints.

Environment variables:
  GPU_API_KEY: Required API key (if empty, auth is disabled)
  GPU_REQUIRE_AUTH: Enable/disable auth (default: true if GPU_API_KEY is set)
"""

import os
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

GPU_API_KEY = os.getenv("GPU_API_KEY", "")
GPU_REQUIRE_AUTH = os.getenv("GPU_REQUIRE_AUTH", "true" if GPU_API_KEY else "false").lower() == "true"

# Endpoints that don't require auth
PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/metrics"}


class ApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth if disabled
        if not GPU_REQUIRE_AUTH or not GPU_API_KEY:
            return await call_next(request)

        # Skip auth for public endpoints
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        # Check API key from header or query param
        api_key = request.headers.get("X-API-Key") or request.query_params.get("api_key")

        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing API key. Provide X-API-Key header."},
            )

        if api_key != GPU_API_KEY:
            logger.warning(f"Invalid API key attempt from {request.client.host if request.client else 'unknown'}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid API key."},
            )

        return await call_next(request)
