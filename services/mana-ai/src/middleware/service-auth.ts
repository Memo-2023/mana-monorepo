/**
 * Service-to-service auth: validates X-Service-Key against MANA_SERVICE_KEY.
 * All admin routes on this service are service-only — no end-user JWTs.
 */

import type { MiddlewareHandler } from 'hono';

export function serviceAuth(serviceKey: string): MiddlewareHandler {
	return async (c, next) => {
		const key = c.req.header('X-Service-Key');
		if (!key || key !== serviceKey) {
			return c.json({ error: 'invalid or missing service key' }, 401);
		}
		await next();
	};
}
