/**
 * mana-auth — Central authentication service
 *
 * Hono + Bun runtime. Replaces NestJS-based mana-core-auth.
 * Uses Better Auth natively (fetch-based handler, no Express conversion).
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
import { SecurityEventsService, AccountLockoutService } from './services/security';
import { SignupLimitService } from './services/signup-limit';
import { ApiKeysService } from './services/api-keys';
import { createAuthRoutes } from './routes/auth';
import { createGuildRoutes } from './routes/guilds';
import { createApiKeyRoutes, createApiKeyValidationRoute } from './routes/api-keys';
import { createMeRoutes } from './routes/me';
import { createAdminRoutes } from './routes/admin';

// ─── Bootstrap ──────────────────────────────────────────────

const config = loadConfig();
const db = getDb(config.databaseUrl);
const auth = createBetterAuth(config.databaseUrl);

// Initialize services
initializeEmail(config.smtp);
const security = new SecurityEventsService(db);
const lockout = new AccountLockoutService(db);
const signupLimit = new SignupLimitService(db);
const apiKeysService = new ApiKeysService(db);

// ─── App ────────────────────────────────────────────────────

const app = new Hono();

app.onError(errorHandler);
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

app.all('/api/auth/*', async (c) => auth.handler(c.req.raw));
app.get('/.well-known/openid-configuration', async (c) => auth.handler(c.req.raw));

// ─── Custom Auth Endpoints ──────────────────────────────────

app.route('/api/v1/auth', createAuthRoutes(auth, config, security, lockout, signupLimit));

// ─── Guilds ─────────────────────────────────────────────────

app.use('/api/v1/gilden/*', jwtAuth(config.baseUrl));
app.route('/api/v1/gilden', createGuildRoutes(auth, config));

// ─── API Keys ───────────────────────────────────────────────

app.use('/api/v1/api-keys/*', jwtAuth(config.baseUrl));
app.route('/api/v1/api-keys', createApiKeyRoutes(apiKeysService));
app.route('/api/v1/api-keys', createApiKeyValidationRoute(apiKeysService));

// ─── Me (GDPR) ──────────────────────────────────────────────

app.use('/api/v1/me/*', jwtAuth(config.baseUrl));
app.route('/api/v1/me', createMeRoutes(db));

// ─── Admin ──────────────────────────────────────────────────

app.use('/api/v1/admin/*', jwtAuth(config.baseUrl));
app.route('/api/v1/admin', createAdminRoutes(db));

// ─── Internal API ───────────────────────────────────────────

app.use('/api/v1/internal/*', serviceAuth(config.serviceKey));

app.get('/api/v1/internal/org/:orgId/member/:userId', async (c) => {
	const { orgId, userId } = c.req.param();
	const { members } = await import('./db/schema/organizations');
	const { eq, and } = await import('drizzle-orm');
	const [member] = await db
		.select()
		.from(members)
		.where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
		.limit(1);
	return c.json({ isMember: !!member, role: member?.role || '' });
});

// ─── Login Page (OIDC) ─────────────────────────────────────

app.get('/login', (c) => {
	const q = c.req.query();
	return c.html(`<!DOCTYPE html>
<html><head><title>ManaCore Login</title></head>
<body style="font-family:system-ui;max-width:400px;margin:80px auto;padding:20px;">
<h1>ManaCore Login</h1>
<form method="POST" action="/api/auth/sign-in/email">
<input type="hidden" name="callbackURL" value="${q.callbackURL || '/'}" />
<label>Email<br><input type="email" name="email" required style="width:100%;padding:8px;margin:4px 0 12px;"></label>
<label>Password<br><input type="password" name="password" required style="width:100%;padding:8px;margin:4px 0 12px;"></label>
<button type="submit" style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;cursor:pointer;">Login</button>
</form></body></html>`);
});

// ─── Start ──────────────────────────────────────────────────

console.log(`mana-auth starting on port ${config.port}...`);

export default { port: config.port, fetch: app.fetch };
