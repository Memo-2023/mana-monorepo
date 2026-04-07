/**
 * mana-events — Public RSVP & event sharing service.
 *
 * Hono + Bun runtime. Stores published event snapshots and the public
 * RSVP responses they collect. Hosts authenticate via mana-auth JWT;
 * RSVP endpoints are intentionally unauthenticated so anyone with a
 * share link can respond.
 *
 * The Hono app itself lives in app.ts so unit tests can import it
 * without triggering the production bootstrap (sweeper, log, port).
 */

import { createApp } from './app';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { startRateBucketSweeper } from './lib/cleanup';

const config = loadConfig();
const db = getDb(config.databaseUrl);

// Background cleanup of stale rate-limit buckets so they don't
// accumulate for the lifetime of long-published events.
startRateBucketSweeper(db);

console.log(`mana-events starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: createApp(db, config).fetch,
};
