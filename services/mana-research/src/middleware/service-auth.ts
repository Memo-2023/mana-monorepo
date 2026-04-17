/**
 * Service-to-Service Authentication Middleware
 *
 * Validates X-Service-Key header for backend-to-backend calls.
 * Used by /internal/* routes and for calls from mana-ai.
 */

import type { MiddlewareHandler } from 'hono';
import { UnauthorizedError } from '../lib/errors';

export function serviceAuth(serviceKey: string): MiddlewareHandler {
	return async (c, next) => {
		const key = c.req.header('X-Service-Key');
		if (!key || key !== serviceKey) {
			throw new UnauthorizedError('Invalid or missing service key');
		}
		const appId = c.req.header('X-App-Id') || 'unknown';
		c.set('appId', appId);
		c.set('service', true);
		await next();
	};
}
