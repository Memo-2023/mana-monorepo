"""Redis caching utilities (optional)."""

import hashlib
import json
import logging
from typing import Any

from src.config import settings

logger = logging.getLogger(__name__)

# Redis client (lazy initialized)
_redis_client = None


async def get_redis_client():
    """Get or create Redis client."""
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    if not settings.redis_url:
        return None

    try:
        import redis.asyncio as redis

        _redis_client = redis.from_url(settings.redis_url)
        # Test connection
        await _redis_client.ping()
        logger.info(f"Connected to Redis at {settings.redis_url}")
        return _redis_client
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}")
        return None


def generate_cache_key(prefix: str, data: dict[str, Any]) -> str:
    """Generate a cache key from request data."""
    # Serialize and hash the data for consistent key
    serialized = json.dumps(data, sort_keys=True)
    hash_value = hashlib.sha256(serialized.encode()).hexdigest()[:16]
    return f"mana-llm:{prefix}:{hash_value}"


async def get_cached(key: str) -> dict[str, Any] | None:
    """Get cached value by key."""
    client = await get_redis_client()
    if client is None:
        return None

    try:
        value = await client.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        logger.warning(f"Cache get failed: {e}")

    return None


async def set_cached(key: str, value: dict[str, Any], ttl: int | None = None) -> bool:
    """Set cached value with optional TTL."""
    client = await get_redis_client()
    if client is None:
        return False

    try:
        ttl = ttl or settings.cache_ttl
        serialized = json.dumps(value)
        await client.setex(key, ttl, serialized)
        return True
    except Exception as e:
        logger.warning(f"Cache set failed: {e}")
        return False


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client

    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
