/**
 * mana-auth — Central authentication service
 *
 * Hono + Bun runtime. Replaces NestJS-based mana-core-auth.
 * Uses Better Auth natively (fetch-based handler, no Express conversion).
 *
 * Better Auth handles:
 * - Email/password auth with verification
 * - JWT tokens (EdDSA via JWKS)
 * - Sessions with cross-domain SSO
 * - Organizations (B2B multi-tenant)
 * - OIDC Provider (Matrix/Synapse SSO)
 * - Two-factor authentication (TOTP)
 * - Magic links (passwordless)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { createBetterAuth } from './auth/better-auth.config';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { serviceAuth } from './middleware/service-auth';
import { initializeEmail } from './email/send';

// ─── Bootstrap ──────────────────────────────────────────────

const config = loadConfig();
const db = getDb(config.databaseUrl);
const auth = createBetterAuth(config.databaseUrl);

// Initialize email transport
initializeEmail(config.smtp);

// ─── App ────────────────────────────────────────────────────

const app = new Hono();

app.onError(errorHandler);

// CORS — must match Better Auth trustedOrigins
app.use(
	'*',
	cors({
		origin: config.cors.origins,
		credentials: true,
		allowHeaders: ['Content-Type', 'Authorization', 'X-Service-Key', 'X-App-Id'],
		exposeHeaders: ['Set-Cookie'],
	})
);

// ─── Health ─────────────────────────────────────────────────

app.get('/health', (c) =>
	c.json({ status: 'ok', service: 'mana-auth', timestamp: new Date().toISOString() })
);

// ─── Better Auth Native Handler ─────────────────────────────
// Better Auth's handler is fetch-based — Hono is fetch-based.
// No Express↔Fetch conversion needed! Just forward the request.

app.all('/api/auth/*', async (c) => {
	const response = await auth.handler(c.req.raw);
	return response;
});

// OIDC Discovery (must be at root)
app.get('/.well-known/openid-configuration', async (c) => {
	const response = await auth.handler(c.req.raw);
	return response;
});

// ─── Custom Auth Endpoints ──────────────────────────────────
// Wrapper routes that add business logic around Better Auth

app.post('/api/v1/auth/register', async (c) => {
	const body = await c.req.json();

	// Store source app URL for email verification redirect
	if (body.sourceAppUrl && body.email) {
		const { sourceAppStore } = await import('./auth/stores');
		sourceAppStore.set(body.email, body.sourceAppUrl);
	}

	// Forward to Better Auth sign-up
	const signUpUrl = new URL('/api/auth/sign-up/email', config.baseUrl);
	const response = await auth.handler(
		new Request(signUpUrl, {
			method: 'POST',
			headers: c.req.raw.headers,
			body: JSON.stringify({
				email: body.email,
				password: body.password,
				name: body.name || body.email.split('@')[0],
			}),
		})
	);

	if (response.ok) {
		// Initialize credit balance via mana-credits (fire-and-forget)
		const result = await response.json();
		if (result?.user?.id) {
			fetch(`${config.manaCreditsUrl}/api/v1/internal/credits/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
				body: JSON.stringify({ userId: result.user.id }),
			}).catch(() => {});
		}
		return c.json(result);
	}

	// Forward error response
	const errorBody = await response.text();
	return c.text(errorBody, response.status as any);
});

app.post('/api/v1/auth/login', async (c) => {
	const body = await c.req.json();

	const signInUrl = new URL('/api/auth/sign-in/email', config.baseUrl);
	const response = await auth.handler(
		new Request(signInUrl, {
			method: 'POST',
			headers: c.req.raw.headers,
			body: JSON.stringify({ email: body.email, password: body.password }),
		})
	);

	// Copy Set-Cookie headers for SSO
	const newResponse = new Response(response.body, {
		status: response.status,
		headers: response.headers,
	});
	return newResponse;
});

app.post('/api/v1/auth/validate', jwtAuth(config.baseUrl), async (c) => {
	const user = c.get('user');
	return c.json({ valid: true, payload: user });
});

app.post('/api/v1/auth/logout', async (c) => {
	const signOutUrl = new URL('/api/auth/sign-out', config.baseUrl);
	return auth.handler(
		new Request(signOutUrl, {
			method: 'POST',
			headers: c.req.raw.headers,
		})
	);
});

app.get('/api/v1/auth/session', async (c) => {
	const sessionUrl = new URL('/api/auth/get-session', config.baseUrl);
	return auth.handler(
		new Request(sessionUrl, {
			method: 'GET',
			headers: c.req.raw.headers,
		})
	);
});

// ─── Internal API (service-to-service) ──────────────────────

app.get('/api/v1/internal/org/:orgId/member/:userId', serviceAuth(config.serviceKey), async (c) => {
	const { orgId, userId } = c.req.param();
	// Query members table directly
	const { eq, and } = await import('drizzle-orm');
	const { members } = await import('./db/schema/organizations');
	const [member] = await db
		.select()
		.from(members)
		.where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
		.limit(1);

	return c.json({
		isMember: !!member,
		role: member?.role || '',
	});
});

// ─── Login Page (for OIDC) ──────────────────────────────────

app.get('/login', (c) => {
	const query = c.req.query();
	return c.html(`<!DOCTYPE html>
<html><head><title>ManaCore Login</title></head>
<body style="font-family:system-ui;max-width:400px;margin:80px auto;padding:20px;">
<h1>ManaCore Login</h1>
<form method="POST" action="/api/auth/sign-in/email">
<input type="hidden" name="callbackURL" value="${query.callbackURL || '/'}" />
<label>Email<br><input type="email" name="email" required style="width:100%;padding:8px;margin:4px 0 12px;"></label>
<label>Password<br><input type="password" name="password" required style="width:100%;padding:8px;margin:4px 0 12px;"></label>
<button type="submit" style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;cursor:pointer;">Login</button>
</form>
</body></html>`);
});

// ─── Start ──────────────────────────────────────────────────

console.log(`mana-auth starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
