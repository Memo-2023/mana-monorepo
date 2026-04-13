/**
 * Service-to-Service Authentication Middleware
 *
 * Validates X-Service-Key header for backend-to-backend calls.
 * Used by /internal/* routes.
 */

import type { MiddlewareHandler } from 'hono';
import { UnauthorizedError } from '../lib/errors';

/**
 * Middleware that validates X-Service-Key header.
 * Sets c.set('appId', ...) from X-App-Id header.
 */
export function serviceAuth(serviceKey: string): MiddlewareHandler {
	return async (c, next) => {
		const key = c.req.header('X-Service-Key');
		if (!key || key !== serviceKey) {
			throw new UnauthorizedError('Invalid or missing service key');
		}

		const appId = c.req.header('X-App-Id') || 'unknown';
		c.set('appId', appId);
		await next();
	};
}
