/**
 * Redis cache wrapper. Graceful degradation — if Redis is down, cache methods
 * return null (miss) and set() is a no-op so the service still works.
 */

import Redis from 'ioredis';
import { createHash } from 'node:crypto';

let redis: Redis | null = null;

export function initCache(redisUrl: string) {
	if (redis) return redis;
	redis = new Redis(redisUrl, {
		lazyConnect: true,
		maxRetriesPerRequest: 2,
		enableOfflineQueue: false,
	});
	redis.on('error', (err) => {
		console.warn('[cache] redis error:', err.message);
	});
	redis.connect().catch((err) => {
		console.warn('[cache] connect failed, running without cache:', err.message);
	});
	return redis;
}

export function cacheKey(
	category: string,
	providerId: string,
	query: string,
	opts: unknown
): string {
	const h = createHash('sha256');
	h.update(providerId);
	h.update('\0');
	h.update(query);
	h.update('\0');
	h.update(JSON.stringify(opts ?? {}));
	return `research:${category}:${providerId}:${h.digest('hex').slice(0, 32)}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	if (!redis || redis.status !== 'ready') return null;
	try {
		const raw = await redis.get(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
	if (!redis || redis.status !== 'ready') return;
	try {
		await redis.setex(key, ttlSeconds, JSON.stringify(value));
	} catch {
		/* ignore */
	}
}
