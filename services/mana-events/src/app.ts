/**
 * App factory — kept separate from index.ts so tests can import it
 * without triggering the production bootstrap (sweeper, log, port bind).
 */

import { Hono, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import type { Config } from './config';
import type { Database } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { healthRoutes } from './routes/health';
import { createEventsRoutes } from './routes/events';
import { createRsvpRoutes } from './routes/rsvp';

/**
 * Build the Hono app. The auth middleware is injected so tests can swap
 * the real JWKS-validating jwtAuth for a header-based mock without
 * spinning up a real mana-auth instance.
 */
export function createApp(
	db: Database,
	config: Config,
	authMiddleware: MiddlewareHandler = jwtAuth(config.manaAuthUrl)
): Hono {
	const app = new Hono();

	app.onError(errorHandler);
	app.use(
		'*',
		cors({
			origin: config.cors.origins,
			credentials: true,
		})
	);

	// Public — no auth
	app.route('/health', healthRoutes);
	app.route('/api/v1/rsvp', createRsvpRoutes(db, config));

	// Authenticated host endpoints
	app.use('/api/v1/events/*', authMiddleware);
	app.route('/api/v1/events', createEventsRoutes(db));

	return app;
}
