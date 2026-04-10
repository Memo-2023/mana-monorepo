/**
 * App factory — separated from index.ts so tests can import without
 * triggering the production bootstrap.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Config } from './config';
import { healthRoutes } from './routes/health';
import { createGeocodeRoutes } from './routes/geocode';

export function createApp(config: Config): Hono {
	const app = new Hono();

	app.onError((err, c) => {
		console.error('Unhandled error:', err);
		return c.json({ error: 'internal_error' }, 500);
	});

	app.use(
		'*',
		cors({
			origin: config.cors.origins,
			credentials: true,
		})
	);

	app.route('/health', healthRoutes);
	app.route('/api/v1/geocode', createGeocodeRoutes(config));

	return app;
}
