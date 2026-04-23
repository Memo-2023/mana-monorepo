/**
 * mana-persona-runner — tick-loop service that drives persona accounts
 * through Claude + MCP.
 *
 * Scope of this file today (M3.a scaffold):
 *   - bootstrap Hono on :3070
 *   - /health, /metrics stub, /diag/login (dev-only: prove login works)
 *   - no tick loop yet — that lands in M3.b, along with the Claude + MCP
 *     integration
 *
 * Plan: docs/plans/mana-mcp-and-personas.md (M3).
 */

import { Hono } from 'hono';
import { AuthClient } from './clients/auth.ts';
import { loadConfig, assertProductionSecrets } from './config.ts';
import { personaPassword } from './password.ts';

const config = loadConfig();
assertProductionSecrets(config);

const authClient = new AuthClient(config.authUrl);

const app = new Hono();

// ─── Health / metrics ─────────────────────────────────────────────

app.get('/health', (c) =>
	c.json({
		status: 'ok',
		service: 'mana-persona-runner',
		paused: config.paused,
		tickIntervalMs: config.tickIntervalMs,
		concurrency: config.concurrency,
	})
);

app.get('/metrics', (c) =>
	c.text('# mana-persona-runner metrics stub — populated alongside the tick loop in M3.b\n')
);

// ─── Dev diagnostics ──────────────────────────────────────────────
//
// `/diag/login?email=persona.anna@mana.test` lets a developer verify
// the password derivation + mana-auth wiring end-to-end without
// spinning up the full tick loop. Only responds in non-production.

app.get('/diag/login', async (c) => {
	if (process.env.NODE_ENV === 'production') {
		return c.json({ error: 'diagnostics disabled in production' }, 404);
	}
	const email = c.req.query('email');
	if (!email) return c.json({ error: 'email query required' }, 400);
	try {
		const password = personaPassword(email, config.personaSeedSecret);
		const { userId, spaceId } = await authClient.loginAndResolvePersonalSpace(email, password);
		return c.json({ ok: true, email, userId, spaceId });
	} catch (err) {
		return c.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
	}
});

// ─── Server ───────────────────────────────────────────────────────

console.info(
	`[mana-persona-runner] listening on :${config.port} ` +
		`(auth=${config.authUrl} mcp=${config.mcpUrl} paused=${config.paused})`
);

if (config.paused) {
	console.info('[mana-persona-runner] loop is PAUSED via RUNNER_PAUSED — health-only mode');
}

export default {
	port: config.port,
	fetch: app.fetch,
};
