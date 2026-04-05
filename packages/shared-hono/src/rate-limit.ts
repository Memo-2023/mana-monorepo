/**
 * Simple in-memory rate limiting middleware for Hono servers.
 *
 * Uses a sliding window counter per IP address.
 * Suitable for single-instance deployments (Mac Mini).
 *
 * Usage:
 * ```ts
 * import { rateLimitMiddleware } from '@mana/shared-hono/rate-limit';
 * app.use('/api/*', rateLimitMiddleware({ max: 100, windowMs: 60_000 }));
 * ```
 */

import type { Context, Next } from 'hono';

interface RateLimitOptions {
	/** Maximum requests per window (default: 100) */
	max?: number;
	/** Window duration in milliseconds (default: 60_000 = 1 minute) */
	windowMs?: number;
	/** Key extractor — defaults to IP address */
	keyFn?: (c: Context) => string;
}

interface WindowEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) store.delete(key);
	}
}, 5 * 60_000);

export function rateLimitMiddleware(options: RateLimitOptions = {}) {
	const { max = 100, windowMs = 60_000, keyFn } = options;

	return async (c: Context, next: Next): Promise<void | Response> => {
		const key = keyFn
			? keyFn(c)
			: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
				c.req.header('x-real-ip') ||
				'unknown';

		const now = Date.now();
		let entry = store.get(key);

		if (!entry || entry.resetAt <= now) {
			entry = { count: 0, resetAt: now + windowMs };
			store.set(key, entry);
		}

		entry.count++;

		c.header('X-RateLimit-Limit', String(max));
		c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
		c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

		if (entry.count > max) {
			return c.json({ error: 'Too many requests' }, 429);
		}

		await next();
	};
}
