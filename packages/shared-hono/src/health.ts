/**
 * Health check route for Hono servers.
 *
 * Returns JSON compatible with the NestJS HealthModule format
 * so monitoring/health-checks work without changes.
 */

import { Hono } from 'hono';

const startTime = Date.now();

/**
 * Create a health check route.
 *
 * Usage:
 * ```ts
 * import { healthRoute } from '@manacore/shared-hono/health';
 * app.route('/health', healthRoute('calendar-server'));
 * ```
 */
export function healthRoute(serviceName: string, version?: string): Hono {
	const route = new Hono();

	route.get('/', (c) =>
		c.json({
			status: 'ok',
			service: serviceName,
			runtime: 'bun',
			timestamp: new Date().toISOString(),
			uptime: Math.floor((Date.now() - startTime) / 1000),
			...(version ? { version } : {}),
		})
	);

	return route;
}
