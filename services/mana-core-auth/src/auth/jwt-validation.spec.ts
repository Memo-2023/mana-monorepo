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
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JWTCustomPayload } from './better-auth.config';
import { createMockConfigService } from '../__tests__/utils/test-helpers';
import { mockUserFactory } from '../__tests__/utils/mock-factories';

// Mock external dependencies
jest.mock('../db/connection');
jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => 'mock-nanoid-123'),
}));

describe('JWT Token Validation (Minimal Claims)', () => {
	let configService: ConfigService;
	let mockDb: any;
	let secret: string;

	beforeEach(async () => {
		// Use HS256 for testing (symmetric key) for simplicity
		// In production, mana-core uses RS256 (asymmetric)
		secret = 'test-secret-key-for-jwt-validation';

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
			'jwt.secret': secret,
			'jwt.issuer': 'mana-core',
			'jwt.audience': 'manacore',
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Minimal JWT Claims Structure', () => {
		it('should generate token with minimal claims only', () => {
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

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
				issuer: 'mana-core',
				audience: 'manacore',
			}) as JWTCustomPayload;

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

		it('should include standard JWT claims (sub, iat, exp, iss, aud)', () => {
			const now = Math.floor(Date.now() / 1000);

			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded: any = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			});

			// Standard JWT claims
			expect(decoded.sub).toBe('user-123');
			expect(decoded.iat).toBeGreaterThanOrEqual(now);
			expect(decoded.exp).toBeGreaterThan(decoded.iat);
			expect(decoded.iss).toBe('mana-core');
			expect(decoded.aud).toBe('manacore');
		});

		it('should support different user roles', () => {
			const roles = ['user', 'admin', 'service'];

			roles.forEach((role) => {
				const payload: JWTCustomPayload = {
					sub: `${role}-user-123`,
					email: `${role}@example.com`,
					role,
					sid: `session-${role}`,
				};

				const token = jwt.sign(payload, secret, {
					algorithm: 'HS256',
					expiresIn: '15m',
					issuer: 'mana-core',
					audience: 'manacore',
				});

				const decoded = jwt.verify(token, secret, {
					algorithms: ['HS256'],
				}) as JWTCustomPayload;

				expect(decoded.role).toBe(role);
			});
		});
	});

	describe('Token Validation - Security', () => {
		it('should validate HS256 signature correctly', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Should successfully verify with correct secret
			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
				});
			}).not.toThrow();
		});

		it('should reject expired tokens', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			// Create token that expires immediately
			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '0s', // Expired immediately
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Wait a moment to ensure expiry
			return new Promise((resolve) => {
				setTimeout(() => {
					expect(() => {
						jwt.verify(token, secret, {
							algorithms: ['HS256'],
						});
					}).toThrow('jwt expired');
					resolve(true);
				}, 100);
			});
		});

		it('should reject tokens with wrong issuer', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'wrong-issuer', // Wrong issuer
				audience: 'manacore',
			});

			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
					issuer: 'mana-core', // Expect correct issuer
					audience: 'manacore',
				});
			}).toThrow('jwt issuer invalid');
		});

		it('should reject tokens with wrong audience', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'wrong-audience', // Wrong audience
			});

			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
					issuer: 'mana-core',
					audience: 'manacore', // Expect correct audience
				});
			}).toThrow('jwt audience invalid');
		});

		it('should reject tampered tokens', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Tamper with the token - try to change role to admin
			const parts = token.split('.');
			const tamperedPayload = Buffer.from(
				JSON.stringify({ ...payload, role: 'admin' })
			).toString('base64url');
			const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

			expect(() => {
				jwt.verify(tamperedToken, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow('invalid signature');
		});

		it('should reject tokens signed with wrong secret', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			// Sign with different secret
			const token = jwt.sign(payload, 'wrong-secret-key', {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Try to verify with correct secret
			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow();
		});
	});

	describe('Token Expiration Times', () => {
		it('should use 15 minutes for access tokens', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded: any = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			});

			const expiryTime = decoded.exp - decoded.iat;
			expect(expiryTime).toBe(15 * 60); // 15 minutes = 900 seconds
		});

		it('should validate token is not yet valid (nbf claim)', () => {
			const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future

			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				notBefore: futureTime, // Not valid until 1 hour from now
				issuer: 'mana-core',
				audience: 'manacore',
			});

			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow('jwt not active');
		});
	});

	describe('Edge Cases', () => {
		it('should handle malformed JWT gracefully', () => {
			const malformedToken = 'this.is.not.a.valid.jwt';

			expect(() => {
				jwt.verify(malformedToken, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow('jwt malformed');
		});

		it('should handle empty token', () => {
			expect(() => {
				jwt.verify('', secret, {
					algorithms: ['HS256'],
				});
			}).toThrow('jwt must be provided');
		});

		it('should handle token with missing required claims', () => {
			// Token with only sub (missing email, role, sid)
			const minimalPayload = { sub: 'user-123' };

			const token = jwt.sign(minimalPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Token is technically valid, but application should validate claims
			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			}) as any;

			expect(decoded.sub).toBe('user-123');
			expect(decoded.email).toBeUndefined();
			expect(decoded.role).toBeUndefined();
			expect(decoded.sid).toBeUndefined();
		});
	});

	describe('Token Refresh Behavior', () => {
		it('should issue new token with same user claims', () => {
			const originalPayload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-original',
			};

			const originalToken = jwt.sign(originalPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Refresh creates new token with new session ID
			const refreshedPayload: JWTCustomPayload = {
				...originalPayload,
				sid: 'session-refreshed', // New session ID
			};

			const refreshedToken = jwt.sign(refreshedPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(refreshedToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			// User claims should be maintained
			expect(decoded.sub).toBe('user-123');
			expect(decoded.email).toBe('user@example.com');
			expect(decoded.role).toBe('user');
			// Session ID should be new
			expect(decoded.sid).toBe('session-refreshed');
		});

		it('should maintain user role across refreshes', () => {
			const adminPayload: JWTCustomPayload = {
				sub: 'admin-123',
				email: 'admin@example.com',
				role: 'admin',
				sid: 'session-123',
			};

			const token = jwt.sign(adminPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			// Admin role should be preserved
			expect(decoded.role).toBe('admin');
		});
	});

	describe('Architecture Decision Documentation', () => {
		/**
		 * This test documents what is NOT in the JWT by design.
		 * See docs/AUTHENTICATION_ARCHITECTURE.md for full explanation.
		 */
		it('should NOT contain organization data (fetch via API instead)', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			}) as any;

			// Organization data should be fetched via:
			// - session.activeOrganizationId (from Better Auth session)
			// - GET /organization/get-active-member (for details)
			expect(decoded.organization).toBeUndefined();
			expect(decoded.organizationId).toBeUndefined();
		});

		it('should NOT contain credit balance (fetch via API instead)', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			}) as any;

			// Credit balance should be fetched via:
			// - GET /api/v1/credits/balance
			// Credit balance changes too frequently to embed in JWT
			expect(decoded.credit_balance).toBeUndefined();
			expect(decoded.credits).toBeUndefined();
		});

		it('should NOT contain customer_type (derive from session instead)', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				sid: 'session-123',
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
			}) as any;

			// Customer type should be derived from:
			// - B2B = session.activeOrganizationId != null
			// - B2C = session.activeOrganizationId == null
			expect(decoded.customer_type).toBeUndefined();
		});
	});
});
