/**
 * JWT Token Validation Tests (Minimal Claims)
 *
 * Tests for JWT token validation with minimal claims:
 * - sub (user ID)
 * - email
 * - role
 * - sid (session ID)
 *
 * ARCHITECTURE DECISION (2024-12):
 * We use MINIMAL JWT claims. Organization and credit data should be fetched
 * via API calls, not embedded in JWTs. See docs/AUTHENTICATION_ARCHITECTURE.md
 *
 * Why minimal claims?
 * 1. Credit balance changes frequently - JWT would be stale
 * 2. Organization context available via Better Auth org plugin APIs
 * 3. Smaller tokens = better performance
 * 4. Follows Better Auth's session-based design
 *
 * NOTE: These tests use jose library (EdDSA/HS256) as per project guidelines.
 * Production uses EdDSA via Better Auth's JWKS.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify, errors } from 'jose';
import { JWTCustomPayload } from './better-auth.config';
import { createMockConfigService } from '../__tests__/utils/test-helpers';
import { mockUserFactory } from '../__tests__/utils/mock-factories';

// Mock external dependencies
jest.mock('../db/connection');
jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => 'mock-nanoid-123'),
}));

// Helper to create JWT using jose
async function signJwt(
	payload: JWTCustomPayload,
	secret: Uint8Array,
	options: { expiresIn?: string; issuer?: string; audience?: string; notBefore?: number } = {}
): Promise<string> {
	const jwt = new SignJWT(payload as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt();

	if (options.expiresIn) {
		jwt.setExpirationTime(options.expiresIn);
	}
	if (options.issuer) {
		jwt.setIssuer(options.issuer);
	}
	if (options.audience) {
		jwt.setAudience(options.audience);
	}
	if (options.notBefore !== undefined) {
		jwt.setNotBefore(options.notBefore);
	}

	return jwt.sign(secret);
}

// Helper to verify JWT using jose
async function verifyJwt(
	token: string,
	secret: Uint8Array,
	options: { issuer?: string; audience?: string } = {}
): Promise<JWTCustomPayload> {
	const { payload } = await jwtVerify(token, secret, {
		algorithms: ['HS256'],
		issuer: options.issuer,
		audience: options.audience,
	});
	return payload as unknown as JWTCustomPayload;
}

describe('JWT Token Validation (Minimal Claims)', () => {
	let configService: ConfigService;
	let mockDb: any;
	let secret: Uint8Array;

	beforeEach(async () => {
		// Use HS256 for testing (symmetric key) for simplicity
		// In production, mana-core uses EdDSA via Better Auth's JWKS
		secret = new TextEncoder().encode('test-secret-key-for-jwt-validation-must-be-32-chars');

		// Create mock database
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			transaction: jest.fn(),
		};

		// Mock getDb
		const { getDb } = require('../db/connection');
		getDb.mockReturnValue(mockDb);

		configService = createMockConfigService({
			'jwt.issuer': 'mana-core',
			'jwt.audience': 'manacore',
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Minimal JWT Claims Structure', () => {
		it('should generate token with minimal claims only', async () => {
			const user = mockUserFactory.create({
				id: 'user-123',
				email: 'user@example.com',
				role: 'user',
			});

			const payload: JWTCustomPayload = {
				sub: user.id,
				email: user.email,
				role: user.role,
				sid: 'session-abc-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret, {
				issuer: 'mana-core',
				audience: 'manacore',
			});

			expect(decoded).toMatchObject({
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-abc-123',
			});

			// Verify NO complex claims are present
			expect((decoded as any).customer_type).toBeUndefined();
			expect((decoded as any).organization).toBeUndefined();
			expect((decoded as any).credit_balance).toBeUndefined();
			expect((decoded as any).app_id).toBeUndefined();
			expect((decoded as any).device_id).toBeUndefined();
		});

		it('should include standard JWT claims (sub, iat, exp, iss, aud)', async () => {
			const now = Math.floor(Date.now() / 1000);

			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret);

			// Standard JWT claims
			expect(decoded.sub).toBe('user-123');
			expect((decoded as any).iat).toBeGreaterThanOrEqual(now);
			expect((decoded as any).exp).toBeGreaterThan((decoded as any).iat);
			expect((decoded as any).iss).toBe('mana-core');
			expect((decoded as any).aud).toBe('manacore');
		});

		it('should support different user roles', async () => {
			const roles = ['user', 'admin', 'service'];

			for (const role of roles) {
				const payload: JWTCustomPayload = {
					sub: `${role}-user-123`,
					email: `${role}@example.com`,
					role,
					sid: `session-${role}`,
				};

				const token = await signJwt(payload, secret, {
					expiresIn: '15m',
					issuer: 'mana-core',
					audience: 'manacore',
				});

				const decoded = await verifyJwt(token, secret);

				expect(decoded.role).toBe(role);
			}
		});
	});

	describe('Token Validation - Security', () => {
		it('should validate HS256 signature correctly', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Should successfully verify with correct secret
			await expect(verifyJwt(token, secret)).resolves.toBeDefined();
		});

		it('should reject expired tokens', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			// Create token that expires immediately
			const token = await signJwt(payload, secret, {
				expiresIn: '0s', // Expired immediately
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Wait a moment to ensure expiry
			await new Promise((resolve) => setTimeout(resolve, 100));

			await expect(verifyJwt(token, secret)).rejects.toThrow(errors.JWTExpired);
		});

		it('should reject tokens with wrong issuer', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'wrong-issuer', // Wrong issuer
				audience: 'manacore',
			});

			await expect(
				verifyJwt(token, secret, {
					issuer: 'mana-core', // Expect correct issuer
					audience: 'manacore',
				})
			).rejects.toThrow(errors.JWTClaimValidationFailed);
		});

		it('should reject tokens with wrong audience', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'wrong-audience', // Wrong audience
			});

			await expect(
				verifyJwt(token, secret, {
					issuer: 'mana-core',
					audience: 'manacore', // Expect correct audience
				})
			).rejects.toThrow(errors.JWTClaimValidationFailed);
		});

		it('should reject tampered tokens', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Tamper with the token - try to change role to admin
			const parts = token.split('.');
			const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, role: 'admin' })).toString(
				'base64url'
			);
			const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

			await expect(verifyJwt(tamperedToken, secret)).rejects.toThrow(
				errors.JWSSignatureVerificationFailed
			);
		});

		it('should reject tokens signed with wrong secret', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			// Sign with different secret
			const wrongSecret = new TextEncoder().encode('wrong-secret-key-for-testing-wrong');

			const token = await signJwt(payload, wrongSecret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Try to verify with correct secret
			await expect(verifyJwt(token, secret)).rejects.toThrow(errors.JWSSignatureVerificationFailed);
		});
	});

	describe('Token Expiration Times', () => {
		it('should use 15 minutes for access tokens', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded: any = await verifyJwt(token, secret);

			const expiryTime = decoded.exp - decoded.iat;
			expect(expiryTime).toBe(15 * 60); // 15 minutes = 900 seconds
		});

		it('should validate token is not yet valid (nbf claim)', async () => {
			const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future

			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				notBefore: futureTime, // Not valid until 1 hour from now
				issuer: 'mana-core',
				audience: 'manacore',
			});

			await expect(verifyJwt(token, secret)).rejects.toThrow(errors.JWTClaimValidationFailed);
		});
	});

	describe('Edge Cases', () => {
		it('should handle malformed JWT gracefully', async () => {
			const malformedToken = 'this.is.not.a.valid.jwt';

			await expect(verifyJwt(malformedToken, secret)).rejects.toThrow();
		});

		it('should handle empty token', async () => {
			await expect(verifyJwt('', secret)).rejects.toThrow();
		});

		it('should handle token with missing required claims', async () => {
			// Token with only sub (missing email, role, sid)
			const minimalPayload = { sub: 'user-123' } as unknown as JWTCustomPayload;

			const token = await signJwt(minimalPayload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Token is technically valid, but application should validate claims
			const decoded = await verifyJwt(token, secret);

			expect(decoded.sub).toBe('user-123');
			expect(decoded.email).toBeUndefined();
			expect(decoded.role).toBeUndefined();
			expect(decoded.sid).toBeUndefined();
		});
	});

	describe('Token Refresh Behavior', () => {
		it('should issue new token with same user claims', async () => {
			const originalPayload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-original',
			};

			const originalToken = await signJwt(originalPayload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Refresh creates new token with new session ID
			const refreshedPayload: JWTCustomPayload = {
				...originalPayload,
				sid: 'session-refreshed', // New session ID
			};

			const refreshedToken = await signJwt(refreshedPayload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(refreshedToken, secret);

			// User claims should be maintained
			expect(decoded.sub).toBe('user-123');
			expect(decoded.email).toBe('user@example.com');
			expect(decoded.role).toBe('user');
			// Session ID should be new
			expect(decoded.sid).toBe('session-refreshed');
		});

		it('should maintain user role across refreshes', async () => {
			const adminPayload: JWTCustomPayload = {
				sub: 'admin-123',
				email: 'admin@example.com',
				role: 'admin',
				sid: 'session-123',
			};

			const token = await signJwt(adminPayload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret);

			// Admin role should be preserved
			expect(decoded.role).toBe('admin');
		});
	});

	describe('Architecture Decision Documentation', () => {
		/**
		 * This test documents what is NOT in the JWT by design.
		 * See docs/AUTHENTICATION_ARCHITECTURE.md for full explanation.
		 */
		it('should NOT contain organization data (fetch via API instead)', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret);

			// Organization data should be fetched via:
			// - session.activeOrganizationId (from Better Auth session)
			// - GET /organization/get-active-member (for details)
			expect((decoded as any).organization).toBeUndefined();
			expect((decoded as any).organizationId).toBeUndefined();
		});

		it('should NOT contain credit balance (fetch via API instead)', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret);

			// Credit balance should be fetched via:
			// - GET /api/v1/credits/balance
			// Credit balance changes too frequently to embed in JWT
			expect((decoded as any).credit_balance).toBeUndefined();
			expect((decoded as any).credits).toBeUndefined();
		});

		it('should NOT contain customer_type (derive from session instead)', async () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = await signJwt(payload, secret, {
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = await verifyJwt(token, secret);

			// Customer type should be derived from:
			// - B2B = session.activeOrganizationId != null
			// - B2C = session.activeOrganizationId == null
			expect((decoded as any).customer_type).toBeUndefined();
		});
	});
});
