/**
 * JWT Authentication Middleware
 *
 * Validates Bearer tokens via JWKS from mana-auth. Mirrors mana-credits pattern.
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
	tier?: string;
}

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
				audience: 'mana',
			});

			const user: AuthUser = {
				userId: payload.sub || '',
				email: (payload.email as string) || '',
				role: (payload.role as string) || 'user',
				tier: payload.tier as string | undefined,
			};

			c.set('user', user);
			await next();
		} catch {
			throw new UnauthorizedError('Invalid or expired token');
		}
	};
}
