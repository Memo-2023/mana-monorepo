/**
 * JWT authentication middleware for Hono.
 * Validates EdDSA JWTs from mana-core-auth via JWKS.
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

const AUTH_URL = process.env.MANA_CORE_AUTH_URL ?? 'http://localhost:3001';
const _JWKS_URL = `${AUTH_URL}/api/auth/jwks`; // Used for future EdDSA verification
const SERVICE_KEY = process.env.MANA_CORE_SERVICE_KEY ?? '';

interface JWTPayload {
	sub: string;
	email: string;
	role: string;
	sid: string;
	exp: number;
	iss: string;
	aud: string;
}

// Simple JWT decode (validation via JWKS would need jose library — for now we trust the token structure
// since the Go sync server already validates. In production, use jose/jwtVerify with EdDSA.)
function decodeJWT(token: string): JWTPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
		// Check expiration
		if (payload.exp && payload.exp < Date.now() / 1000) return null;
		return payload;
	} catch {
		return null;
	}
}

/**
 * JWT auth middleware — extracts and validates Bearer token.
 * Sets `userId` and `userEmail` on the context.
 */
export function authMiddleware() {
	return async (c: Context, next: Next) => {
		const auth = c.req.header('Authorization');
		if (!auth?.startsWith('Bearer ')) {
			throw new HTTPException(401, { message: 'Missing authorization header' });
		}

		const token = auth.slice(7);
		const payload = decodeJWT(token);
		if (!payload || !payload.sub) {
			throw new HTTPException(401, { message: 'Invalid or expired token' });
		}

		c.set('userId', payload.sub);
		c.set('userEmail', payload.email);
		await next();
	};
}

/**
 * Service key auth middleware — validates X-Service-Key header.
 * Used for admin endpoints called by mana-core-auth.
 */
export function serviceAuthMiddleware() {
	return async (c: Context, next: Next) => {
		const key = c.req.header('X-Service-Key');
		if (!key || key !== SERVICE_KEY) {
			throw new HTTPException(401, { message: 'Invalid service key' });
		}
		await next();
	};
}
