import { describe, it, expect } from 'vitest';
import {
	decodeToken,
	isTokenValidLocally,
	isTokenExpired,
	getUserFromToken,
	getTokenExpirationTime,
	getTimeUntilExpiration,
	isB2BUser,
	getB2BInfo,
} from './jwtUtils';

// Helper: create a fake JWT with given payload
function createToken(payload: Record<string, unknown>): string {
	const header = btoa(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
	const body = btoa(JSON.stringify(payload));
	return `${header}.${body}.fakesignature`;
}

describe('decodeToken', () => {
	it('decodes a valid JWT payload', () => {
		const token = createToken({ sub: 'user-1', email: 'test@example.com', exp: 9999999999 });
		const decoded = decodeToken(token);
		expect(decoded).toMatchObject({ sub: 'user-1', email: 'test@example.com' });
	});

	it('returns null for invalid token', () => {
		expect(decodeToken('not-a-jwt')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(decodeToken('')).toBeNull();
	});

	it('returns null for malformed base64', () => {
		expect(decodeToken('a.!!!invalid!!!.c')).toBeNull();
	});
});

describe('isTokenValidLocally', () => {
	it('returns true for non-expired token', () => {
		const futureExp = Math.floor(Date.now() / 1000) + 3600;
		const token = createToken({ sub: 'u', exp: futureExp });
		expect(isTokenValidLocally(token)).toBe(true);
	});

	it('returns false for expired token', () => {
		const pastExp = Math.floor(Date.now() / 1000) - 60;
		const token = createToken({ sub: 'u', exp: pastExp });
		expect(isTokenValidLocally(token)).toBe(false);
	});

	it('returns false when within buffer', () => {
		const almostExpired = Math.floor(Date.now() / 1000) + 5;
		const token = createToken({ sub: 'u', exp: almostExpired });
		expect(isTokenValidLocally(token, 10)).toBe(false);
	});

	it('returns false for token without exp', () => {
		const token = createToken({ sub: 'u' });
		expect(isTokenValidLocally(token)).toBe(false);
	});
});

describe('isTokenExpired', () => {
	it('returns true for expired token', () => {
		const pastExp = Math.floor(Date.now() / 1000) - 60;
		const token = createToken({ sub: 'u', exp: pastExp });
		expect(isTokenExpired(token)).toBe(true);
	});

	it('returns false for valid token', () => {
		const futureExp = Math.floor(Date.now() / 1000) + 3600;
		const token = createToken({ sub: 'u', exp: futureExp });
		expect(isTokenExpired(token)).toBe(false);
	});
});

describe('getUserFromToken', () => {
	it('extracts user data with tier', () => {
		const token = createToken({
			sub: 'user-123',
			email: 'test@mana.how',
			role: 'admin',
			tier: 'founder',
			exp: 9999999999,
		});
		const user = getUserFromToken(token);
		expect(user).toEqual({
			id: 'user-123',
			email: 'test@mana.how',
			role: 'admin',
			tier: 'founder',
		});
	});

	it('defaults tier to public when missing', () => {
		const token = createToken({ sub: 'u', email: 'a@b.c', exp: 9999999999 });
		const user = getUserFromToken(token);
		expect(user?.tier).toBe('public');
	});

	it('defaults role to user when missing', () => {
		const token = createToken({ sub: 'u', email: 'a@b.c', exp: 9999999999 });
		expect(getUserFromToken(token)?.role).toBe('user');
	});

	it('falls back to user_metadata.email', () => {
		const token = createToken({
			sub: 'u',
			user_metadata: { email: 'meta@test.com' },
			exp: 9999999999,
		});
		expect(getUserFromToken(token)?.email).toBe('meta@test.com');
	});

	it('falls back to storedEmail', () => {
		const token = createToken({ sub: 'u', exp: 9999999999 });
		expect(getUserFromToken(token, 'stored@test.com')?.email).toBe('stored@test.com');
	});

	it('defaults email to user@example.com when all sources empty', () => {
		const token = createToken({ sub: 'u', exp: 9999999999 });
		expect(getUserFromToken(token)?.email).toBe('user@example.com');
	});

	it('returns null for invalid token', () => {
		expect(getUserFromToken('garbage')).toBeNull();
	});
});

describe('getTokenExpirationTime', () => {
	it('returns exp in milliseconds', () => {
		const exp = 1700000000;
		const token = createToken({ sub: 'u', exp });
		expect(getTokenExpirationTime(token)).toBe(exp * 1000);
	});

	it('returns null without exp', () => {
		const token = createToken({ sub: 'u' });
		expect(getTokenExpirationTime(token)).toBeNull();
	});
});

describe('getTimeUntilExpiration', () => {
	it('returns positive ms for future token', () => {
		const futureExp = Math.floor(Date.now() / 1000) + 3600;
		const token = createToken({ sub: 'u', exp: futureExp });
		const remaining = getTimeUntilExpiration(token);
		expect(remaining).toBeGreaterThan(3500000);
		expect(remaining).toBeLessThanOrEqual(3600000);
	});

	it('returns 0 for expired token', () => {
		const pastExp = Math.floor(Date.now() / 1000) - 60;
		const token = createToken({ sub: 'u', exp: pastExp });
		expect(getTimeUntilExpiration(token)).toBe(0);
	});
});

describe('isB2BUser', () => {
	it('returns true for is_b2b: true', () => {
		const token = createToken({ sub: 'u', is_b2b: true, exp: 9999999999 });
		expect(isB2BUser(token)).toBe(true);
	});

	it('returns true for is_b2b: "true"', () => {
		const token = createToken({ sub: 'u', is_b2b: 'true', exp: 9999999999 });
		expect(isB2BUser(token)).toBe(true);
	});

	it('returns true for is_b2b: 1', () => {
		const token = createToken({ sub: 'u', is_b2b: 1, exp: 9999999999 });
		expect(isB2BUser(token)).toBe(true);
	});

	it('returns false when not set', () => {
		const token = createToken({ sub: 'u', exp: 9999999999 });
		expect(isB2BUser(token)).toBe(false);
	});
});

describe('getB2BInfo', () => {
	it('extracts B2B settings', () => {
		const token = createToken({
			sub: 'u',
			app_settings: {
				b2b: {
					disableRevenueCat: true,
					organizationId: 'org-1',
					plan: 'enterprise',
					role: 'admin',
				},
			},
			exp: 9999999999,
		});
		expect(getB2BInfo(token)).toEqual({
			disableRevenueCat: true,
			organizationId: 'org-1',
			plan: 'enterprise',
			role: 'admin',
		});
	});

	it('returns null when no B2B settings', () => {
		const token = createToken({ sub: 'u', exp: 9999999999 });
		expect(getB2BInfo(token)).toBeNull();
	});
});
