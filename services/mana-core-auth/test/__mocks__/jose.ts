/**
 * Mock implementation of jose for tests
 *
 * Provides mock implementations of JWT verification and JWKS functions
 * used by better-auth.service.ts
 */

export interface JWTPayload {
	sub?: string;
	email?: string;
	role?: string;
	sessionId?: string;
	sid?: string;
	iat?: number;
	exp?: number;
	iss?: string;
	aud?: string | string[];
	[key: string]: unknown;
}

export interface JWTVerifyResult {
	payload: JWTPayload;
	protectedHeader: {
		alg: string;
		typ?: string;
	};
	key?: any; // Optional key from ResolvedKey
}

/**
 * Mock JWKS implementation
 */
class MockKeySet {
	private url: URL;

	constructor(url: URL) {
		this.url = url;
	}
}

/**
 * Mock jwtVerify function
 * Returns a valid payload for testing purposes
 */
export const jwtVerify = jest.fn(
	async (token: string, _keySet: MockKeySet, _options?: unknown): Promise<JWTVerifyResult> => {
		// For tests, decode the token if it's a valid JWT format, otherwise return mock data
		try {
			const parts = token.split('.');
			if (parts.length === 3) {
				// Try to decode the payload (middle part)
				const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
				return {
					payload,
					protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				};
			}
		} catch {
			// If decoding fails, return mock data
		}

		// Return mock payload for invalid/test tokens
		return {
			payload: {
				sub: 'test-user-id',
				email: 'test@example.com',
				role: 'user',
				sessionId: 'test-session-id',
				sid: 'test-session-id',
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
				iss: 'manacore',
				aud: 'manacore',
			},
			protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
		};
	}
);

/**
 * Mock createRemoteJWKSet function
 */
export const createRemoteJWKSet = jest.fn((url: URL) => {
	return new MockKeySet(url);
});

/**
 * Mock errors for jose
 */
export class JOSEError extends Error {
	code?: string;
	constructor(message?: string) {
		super(message);
		this.name = 'JOSEError';
	}
}

export class JWTExpired extends JOSEError {
	code = 'ERR_JWT_EXPIRED';
	constructor(message?: string) {
		super(message ?? 'JWT expired');
		this.name = 'JWTExpired';
	}
}

export class JWTInvalid extends JOSEError {
	code = 'ERR_JWT_INVALID';
	constructor(message?: string) {
		super(message ?? 'JWT invalid');
		this.name = 'JWTInvalid';
	}
}

export const errors = {
	JOSEError,
	JWTExpired,
	JWTInvalid,
};
