/**
 * news-ingester — pulls public RSS / JSON feeds into news.curated_articles
 * on a fixed interval. Exposes a tiny Hono server for health + manual
 * trigger so the container can be probed and re-kicked without a restart.
 *
 * Why a long-running container instead of a host cron:
 * - logs land in the same docker stack as everything else
 * - restarts on crash via docker
 * - health endpoint for the docker-compose healthcheck
 * - lets us hit /ingest/run from a shell to debug new sources without
 *   waiting 15 minutes
 */

import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { runIngestTick, type TickResult } from './ingest';

const config = loadConfig();
const db = getDb(config.databaseUrl);

let lastTick: TickResult | null = null;
let running = false;

async function tick() {
	if (running) {
		console.log('[news-ingester] previous tick still running, skipping');
		return;
	}
	running = true;
	try {
		lastTick = await runIngestTick(db);
	} catch (err) {
		console.error('[news-ingester] tick failed:', err);
	} finally {
		running = false;
	}
}

// ─── Hono app ──────────────────────────────────────────────

const app = new Hono();

app.get('/health', async (c) => {
	try {
		// Cheap connectivity check — don't claim healthy if Postgres is down.
		await db.execute(sql`SELECT 1`);
	} catch {
		return c.json({ status: 'degraded', service: 'news-ingester' }, 503);
	}
	return c.json({
		status: 'ok',
		service: 'news-ingester',
		lastTickStartedAt: lastTick?.startedAt ?? null,
		lastTickInserted: lastTick?.totalInserted ?? null,
		running,
	});
});

app.get('/status', (c) => c.json(lastTick ?? { message: 'no tick yet' }));

app.post('/ingest/run', async (c) => {
	if (running) return c.json({ status: 'busy' }, 409);
	// Fire-and-forget; client polls /status.
	void tick();
	return c.json({ status: 'started' });
});

// ─── Bootstrap ─────────────────────────────────────────────

console.log(
	`[news-ingester] starting on port ${config.port}, tick every ${config.tickIntervalMs}ms`
);

if (config.runOnStartup) {
	// Defer one tick so the HTTP server is up first (healthchecks pass
	// while we ingest).
	setTimeout(() => void tick(), 5_000);
}

setInterval(() => void tick(), config.tickIntervalMs);

export default { port: config.port, fetch: app.fetch };
