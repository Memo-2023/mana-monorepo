/**
 * Memoro Server — Hono + Bun
 *
 * Replaces the NestJS backend service.
 * Handles: memo processing, transcription callbacks, spaces, invites, credits, settings, cleanup.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import {
	authMiddleware,
	errorHandler,
	notFoundHandler,
	rateLimitMiddleware,
} from '@manacore/shared-hono';

import { memoRoutes } from './routes/memos';
import { spaceRoutes } from './routes/spaces';
import { inviteRoutes } from './routes/invites';
import { creditRoutes } from './routes/credits';
import { internalRoutes } from './routes/internal';
import { settingsRoutes } from './routes/settings';
import { cleanupRoutes } from './routes/cleanup';
import { meetingRoutes } from './routes/meetings';
import { meetingWebhookRoutes } from './routes/meetings-webhooks';
import { COSTS } from './lib/credits';

const app = new Hono();

// ── Global middleware ──────────────────────────────────────────────────────────

app.onError(errorHandler);
app.notFound(notFoundHandler);

app.use('*', logger());

app.use(
	'*',
	cors({
		origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: [
			'Authorization',
			'Content-Type',
			'X-Service-Key',
			'X-Internal-API-Key',
			'X-Client-Id',
		],
		credentials: true,
	})
);

// ── Rate limiting ─────────────────────────────────────────────────────────────

app.use(
	'/api/v1/*',
	rateLimitMiddleware({
		windowMs: 60_000,
		max: 100,
	})
);

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/health', async (c) => {
	const checks: Record<string, 'ok' | 'error'> = {};

	// Check Supabase
	try {
		const { createServiceClient } = await import('./lib/supabase');
		const supabase = createServiceClient();
		const { error } = await supabase.from('memos').select('id').limit(1);
		checks.supabase = error ? 'error' : 'ok';
	} catch {
		checks.supabase = 'error';
	}

	const allOk = Object.values(checks).every((v) => v === 'ok');

	return c.json(
		{
			status: allOk ? 'ok' : 'degraded',
			service: 'memoro-server',
			runtime: 'bun',
			timestamp: new Date().toISOString(),
			checks,
		},
		allOk ? 200 : 503
	);
});

// ── Public routes (no auth) ────────────────────────────────────────────────────

// Credits pricing is public
app.get('/api/v1/credits/pricing', (c) => {
	return c.json({ costs: COSTS });
});

// Internal callbacks use their own service-key auth (not JWT)
app.route('/api/v1/internal', internalRoutes);

// Cleanup uses internal API key
app.route('/api/v1/cleanup', cleanupRoutes);

// Meeting bot webhooks — HMAC-verified, no JWT
app.route('/meetings/webhooks', meetingWebhookRoutes);

// ── Authenticated routes ───────────────────────────────────────────────────────

app.use('/api/v1/*', authMiddleware());

app.route('/api/v1/memos', memoRoutes);
app.route('/api/v1/spaces', spaceRoutes);
app.route('/api/v1/invites', inviteRoutes);
app.route('/api/v1/credits', creditRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/meetings', meetingRoutes);

// ── Start ──────────────────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3015);

console.log(`Memoro server (Hono + Bun) starting on port ${port}`);

export { app };
export default {
	port,
	fetch: app.fetch,
};
