import type { MiddlewareHandler } from 'hono';

interface RateLimiterOptions {
	/** Time window in milliseconds (default: 60000 = 1 minute) */
	windowMs?: number;
	/** Max requests per window per IP (default: 100) */
	max?: number;
}

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * Simple in-memory rate limiter middleware for Hono.
 * Limits requests per IP address within a sliding time window.
 */
export function rateLimiter(options: RateLimiterOptions = {}): MiddlewareHandler {
	const windowMs = options.windowMs ?? 60_000;
	const max = options.max ?? 100;
	const store = new Map<string, RateLimitEntry>();

	// Periodic cleanup of expired entries every 5 minutes
	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now >= entry.resetAt) {
				store.delete(key);
			}
		}
	}, 5 * 60_000);

	return async (c, next) => {
		const ip =
			c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
			c.req.header('x-real-ip') ||
			'unknown';

		const now = Date.now();
		let entry = store.get(ip);

		if (!entry || now >= entry.resetAt) {
			entry = { count: 0, resetAt: now + windowMs };
			store.set(ip, entry);
		}

		entry.count++;

		c.header('X-RateLimit-Limit', String(max));
		c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
		c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

		if (entry.count > max) {
			return c.json(
				{ error: 'Too many requests', retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
				429
			);
		}

		await next();
	};
}
