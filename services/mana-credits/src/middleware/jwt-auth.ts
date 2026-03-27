/**
 * JWT Authentication Middleware
 *
 * Validates Bearer tokens via JWKS from mana-core-auth.
 * Uses jose library with EdDSA algorithm.
 */

import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UnauthorizedError } from '../lib/errors';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(authUrl: string) {
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL('/api/auth/jwks', authUrl));
	}
	return jwks;
}

export interface AuthUser {
	userId: string;
	email: string;
	role: string;
}

/**
 * Middleware that validates JWT tokens from Authorization: Bearer header.
 * Sets c.set('user', { userId, email, role }) on success.
 */
export function jwtAuth(authUrl: string): MiddlewareHandler {
	return async (c, next) => {
		const authHeader = c.req.header('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			throw new UnauthorizedError('Missing or invalid Authorization header');
		}

		const token = authHeader.slice(7);
		try {
			const { payload } = await jwtVerify(token, getJwks(authUrl), {
				issuer: authUrl,
				audience: 'manacore',
			});

			const user: AuthUser = {
				userId: payload.sub || '',
				email: (payload.email as string) || '',
				role: (payload.role as string) || 'user',
			};

			c.set('user', user);
			await next();
		} catch {
			throw new UnauthorizedError('Invalid or expired token');
		}
	};
}
