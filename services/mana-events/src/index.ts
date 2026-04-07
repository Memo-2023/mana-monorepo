/**
 * mana-events — Public RSVP & event sharing service.
 *
 * Hono + Bun runtime. Stores published event snapshots and the public
 * RSVP responses they collect. Hosts authenticate via mana-auth JWT;
 * RSVP endpoints are intentionally unauthenticated so anyone with a
 * share link can respond.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { healthRoutes } from './routes/health';
import { createEventsRoutes } from './routes/events';
import { createRsvpRoutes } from './routes/rsvp';
import { startRateBucketSweeper } from './lib/cleanup';

const config = loadConfig();
const db = getDb(config.databaseUrl);

// Background cleanup of stale rate-limit buckets so they don't accumulate
// for the lifetime of long-published events.
startRateBucketSweeper(db);

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
app.use('/api/v1/events/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/events', createEventsRoutes(db));

console.log(`mana-events starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
