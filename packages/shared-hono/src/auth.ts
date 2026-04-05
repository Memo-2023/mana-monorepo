/**
 * JWT authentication middleware for Hono servers.
 *
 * Verifies EdDSA JWTs from mana-auth via JWKS (cached).
 * Drop-in replacement for @mana/shared-nestjs-auth JwtAuthGuard.
 *
 * Sets `userId`, `userEmail`, `userRole` on Hono context.
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_URL = () => process.env.MANA_AUTH_URL ?? 'http://localhost:3001';
const SERVICE_KEY = () => process.env.MANA_SERVICE_KEY ?? '';

/** Cached JWKS - jose handles refetch cooldown (~10 min) */
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJWKSUrl: string | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
	const jwksUrl = `${AUTH_URL()}/api/v1/auth/jwks`;

	if (cachedJWKS && cachedJWKSUrl === jwksUrl) {
		return cachedJWKS;
	}

	cachedJWKS = createRemoteJWKSet(new URL(jwksUrl));
	cachedJWKSUrl = jwksUrl;
	return cachedJWKS;
}

/**
 * Build the issuer allowlist — accepts auth service URL variants
 * (internal Docker URL, public URL, localhost).
 */
function getIssuers(): string[] {
	const issuers = new Set<string>();
	const jwtIssuer = process.env.JWT_ISSUER;
	const authUrl = process.env.MANA_AUTH_URL;
	if (jwtIssuer) issuers.add(jwtIssuer);
	if (authUrl) issuers.add(authUrl);
	issuers.add('https://auth.mana.how');
	issuers.add('http://localhost:3001');
	return [...issuers];
}

/**
 * JWT auth middleware — verifies Bearer token via JWKS.
 *
 * Usage:
 * ```ts
 * const app = new Hono();
 * app.use('/api/*', authMiddleware());
 * app.get('/api/profile', (c) => {
 *   const userId = c.get('userId');
 *   return c.json({ userId });
 * });
 * ```
 */
export function authMiddleware() {
	return async (c: Context, next: Next) => {
		// Dev bypass
		if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
			c.set('userId', process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000000');
			c.set('userEmail', 'dev@example.com');
			c.set('userRole', 'user');
			return next();
		}

		const auth = c.req.header('Authorization');
		if (!auth?.startsWith('Bearer ')) {
			throw new HTTPException(401, { message: 'Missing authorization header' });
		}

		const token = auth.slice(7);

		try {
			const jwks = getJWKS();
			const audience = process.env.JWT_AUDIENCE ?? 'mana';

			const { payload } = await jwtVerify(token, jwks, {
				issuer: getIssuers(),
				audience,
			});

			if (!payload.sub) {
				throw new HTTPException(401, { message: 'Token missing subject claim' });
			}

			c.set('userId', payload.sub);
			c.set('userEmail', (payload as Record<string, unknown>).email ?? '');
			c.set('userRole', (payload as Record<string, unknown>).role ?? 'user');
			c.set('sessionId', (payload as Record<string, unknown>).sid ?? '');
			return next();
		} catch (err) {
			if (err instanceof HTTPException) throw err;
			console.error('[auth] Token verification failed:', err instanceof Error ? err.message : err);
			throw new HTTPException(401, { message: 'Invalid or expired token' });
		}
	};
}

/**
 * Service key auth middleware — validates X-Service-Key header.
 * Used for admin/GDPR endpoints called by mana-auth.
 *
 * Usage:
 * ```ts
 * app.use('/api/v1/admin/*', serviceAuthMiddleware());
 * ```
 */
export function serviceAuthMiddleware() {
	return async (c: Context, next: Next) => {
		const key = c.req.header('X-Service-Key');
		const expected = SERVICE_KEY();
		if (!key || !expected || key !== expected) {
			throw new HTTPException(401, { message: 'Invalid service key' });
		}
		return next();
	};
}
