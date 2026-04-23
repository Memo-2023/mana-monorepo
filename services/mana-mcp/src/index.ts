/**
 * mana-mcp — MCP gateway service.
 *
 * Exposes `@mana/tool-registry` over Streamable HTTP, JWT-authed via
 * mana-auth's JWKS. Per-user sessions; admin-scoped tools never reach
 * the wire.
 *
 * Port: 3069. See services/mana-mcp/CLAUDE.md.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerAllModules } from '@mana/tool-registry';
import { loadConfig } from './config.ts';
import { authenticateRequest, UnauthorizedError } from './auth.ts';
import { handleMcpRequest } from './transport.ts';

// ─── Bootstrap ────────────────────────────────────────────────────

const config = loadConfig();
registerAllModules();

const app = new Hono();

app.use(
	'*',
	cors({
		origin: config.corsOrigins,
		allowHeaders: ['authorization', 'content-type', 'x-mana-space', 'mcp-session-id'],
		exposeHeaders: ['mcp-session-id'],
		credentials: true,
	})
);

// ─── Health / metrics ─────────────────────────────────────────────

app.get('/health', (c) =>
	c.json({
		status: 'ok',
		service: 'mana-mcp',
		registry: { loaded: true },
	})
);

app.get('/metrics', (c) =>
	c.text('# mana-mcp metrics stub — populated alongside Persona-Runner observability\n')
);

// ─── MCP endpoint ─────────────────────────────────────────────────

app.all('/mcp', async (c) => {
	let user;
	try {
		user = await authenticateRequest(c.req.raw, config.authUrl, config.jwtAudience);
	} catch (err) {
		const msg = err instanceof UnauthorizedError ? err.message : 'Unauthorized';
		return c.json({ error: msg }, 401);
	}
	return handleMcpRequest(c.req.raw, user, config);
});

// ─── Server ───────────────────────────────────────────────────────

console.info(`[mana-mcp] listening on :${config.port} (auth=${config.authUrl})`);

export default {
	port: config.port,
	fetch: app.fetch,
};
