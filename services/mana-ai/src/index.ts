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
import { loadConfig } from './config';
import { closeSql } from './db/connection';
import { runTickOnce, startTick, stopTick, isTickRunning } from './cron/tick';
import { serviceAuth } from './middleware/service-auth';

const config = loadConfig();

const app = new Hono();

app.get('/health', (c) =>
	c.json({
		ok: true,
		service: 'mana-ai',
		version: '0.1.0',
		tick: { enabled: config.tickEnabled, running: isTickRunning() },
	})
);

// Service-to-service: manually fire a tick for CI / ops / debugging
// without waiting for the interval.
app.use('/internal/*', serviceAuth(config.serviceKey));
app.post('/internal/tick', async (c) => {
	const stats = await runTickOnce(config);
	return c.json(stats);
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
