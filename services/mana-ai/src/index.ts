/**
 * mana-ai — background Mission Runner for the AI Workbench.
 *
 * Hono + Bun service that scans mana_sync's `sync_changes` table for due
 * Missions (see `data/ai/missions/` in the webapp), calls mana-llm for
 * planning, and will eventually stage the resulting plan back as mission
 * iterations so the webapp renders them as proposals on next sync.
 *
 * This is v0.1: scaffold + readable due-mission scan + planner-client
 * shape. Execution write-back is tracked as the next PR — see CLAUDE.md.
 */

import { Hono } from 'hono';
import { authMiddleware } from '@mana/shared-hono';
import { loadConfig } from './config';
import { closeSql, getSql } from './db/connection';
import { migrate } from './db/migrate';
import { runTickOnce, startTick, stopTick, isTickRunning } from './cron/tick';
import { serviceAuth } from './middleware/service-auth';
import { register, httpRequestsTotal, httpRequestDuration } from './metrics';
import { configureMissionGrantKey } from './crypto/unwrap-grant';
import { readDecryptAudit } from './db/audit-read';

const config = loadConfig();

// Apply mana_ai schema migration on boot. Idempotent — safe to call on
// every restart and after rolling deploys.
await migrate(getSql(config.syncDatabaseUrl));

// Install the RSA private key used to unwrap Mission Key-Grants. Absent
// env var → grants stay disabled (tick loop skips any mission carrying
// one). See docs/plans/ai-mission-key-grant.md.
configureMissionGrantKey(config.missionGrantPrivateKeyPem);

const app = new Hono();

// HTTP instrumentation — labels by method/path/status, surfaced on /metrics.
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const duration = (Date.now() - start) / 1000;
	const path = c.req.routePath || c.req.path;
	const labels = { method: c.req.method, path, status: c.res.status };
	httpRequestsTotal.inc(labels);
	httpRequestDuration.observe(labels, duration);
});

app.get('/health', (c) =>
	c.json({
		ok: true,
		service: 'mana-ai',
		version: '0.4.0',
		tick: { enabled: config.tickEnabled, running: isTickRunning() },
	})
);

// Prometheus scrape target. Scraped by docker/prometheus/prometheus.yml's
// `mana-ai` job every 30s.
app.get('/metrics', async (c) => {
	c.header('Content-Type', register.contentType);
	return c.text(await register.metrics());
});

// Service-to-service: manually fire a tick for CI / ops / debugging
// without waiting for the interval.
app.use('/internal/*', serviceAuth(config.serviceKey));
app.post('/internal/tick', async (c) => {
	const stats = await runTickOnce(config);
	return c.json(stats);
});

// ─── User-facing audit read ─────────────────────────────────
// JWT-gated. Powers the "Mission → Datenzugriff" tab in the webapp
// Workbench. RLS + withUser ensure the caller only ever sees their own
// rows even if they try to swap in another userId client-side.
app.use('/api/v1/me/ai-audit', authMiddleware());
app.get('/api/v1/me/ai-audit', async (c) => {
	const userId = (c.get as (key: string) => string)('userId');
	const missionId = c.req.query('missionId') ?? undefined;
	const limitRaw = c.req.query('limit');
	const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

	const rows = await readDecryptAudit(getSql(config.syncDatabaseUrl), userId, {
		missionId,
		limit: Number.isFinite(limit) ? limit : undefined,
	});
	return c.json({ rows });
});

const stopScheduledTick = startTick(config);

const server = Bun.serve({
	port: config.port,
	fetch: app.fetch,
});

console.log(`[mana-ai] listening on :${config.port} (tick=${config.tickEnabled ? 'on' : 'off'})`);

// Graceful shutdown — release DB + timer so SIGTERM in k8s shuts down
// the pod instead of waiting for SIGKILL after the grace period.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	process.on(signal, async () => {
		console.log(`[mana-ai] ${signal} received — shutting down`);
		stopScheduledTick();
		server.stop();
		await closeSql();
		process.exit(0);
	});
}
