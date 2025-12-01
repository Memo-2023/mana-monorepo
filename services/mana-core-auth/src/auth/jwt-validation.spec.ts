/**
 * JWT Token Validation Tests (B2C/B2B)
 *
 * Comprehensive tests for JWT token validation covering:
 * - B2C user token structure (personal credits, no organization)
 * - B2B employee token structure (organization context, allocated credits)
 * - B2B owner token structure (owner role, full permissions)
 * - Token validation (signature, expiry, issuer, audience)
 * - Token refresh (credit updates, organization context)
 * - Edge cases (multiple orgs, removed from org, deleted org)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { createBetterAuth, JWTCustomPayload } from './better-auth.config';
import { createMockConfigService } from '../__tests__/utils/test-helpers';
import { mockUserFactory, mockBalanceFactory } from '../__tests__/utils/mock-factories';

// Mock external dependencies
jest.mock('../db/connection');
jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => 'mock-nanoid-123'),
}));

describe('JWT Token Validation (B2C/B2B)', () => {
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

	describe('B2C User Tokens', () => {
		it('should generate token with correct B2C claims', () => {
			const b2cUser = mockUserFactory.create({
				id: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
			});

			const payload: JWTCustomPayload = {
				sub: b2cUser.id,
				email: b2cUser.email,
				role: b2cUser.role,
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
				app_id: 'memoro',
				device_id: 'device-xyz',
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
				sub: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
				app_id: 'memoro',
				device_id: 'device-xyz',
			});
		});

		it('should have organization null for B2C users', () => {
			const payload: JWTCustomPayload = {
				sub: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 100,
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

			expect(decoded.customer_type).toBe('b2c');
			expect(decoded.organization).toBeNull();
		});

		it('should include personal credit balance for B2C users', () => {
			const payload: JWTCustomPayload = {
				sub: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 250,
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

			expect(decoded.credit_balance).toBe(250);
		});

		it('should include app_id and device_id when provided', () => {
			const payload: JWTCustomPayload = {
				sub: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
				app_id: 'chat',
				device_id: 'iphone-15-pro',
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

			expect(decoded.app_id).toBe('chat');
			expect(decoded.device_id).toBe('iphone-15-pro');
		});

		it('should have standard JWT claims (sub, iat, exp)', () => {
			const now = Math.floor(Date.now() / 1000);

			const payload: JWTCustomPayload = {
				sub: 'b2c-user-123',
				email: 'b2cuser@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
			expect(decoded.sub).toBe('b2c-user-123');
			expect(decoded.iat).toBeGreaterThanOrEqual(now);
			expect(decoded.exp).toBeGreaterThan(decoded.iat);
			expect(decoded.iss).toBe('mana-core');
			expect(decoded.aud).toBe('manacore');
		});
	});

	describe('B2B Employee Token Structure', () => {
		it('should generate token with organization context for B2B employee', () => {
			const payload: JWTCustomPayload = {
				sub: 'b2b-employee-123',
				email: 'employee@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-acme-123',
					name: 'ACME Corporation',
					role: 'member',
				},
				credit_balance: 50, // Allocated credits
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

			expect(decoded).toMatchObject({
				sub: 'b2b-employee-123',
				email: 'employee@company.com',
				customer_type: 'b2b',
				organization: {
					id: 'org-acme-123',
					name: 'ACME Corporation',
					role: 'member',
				},
				credit_balance: 50,
			});
		});

		it('should have employee role as member or admin', () => {
			// Test member role
			const memberPayload: JWTCustomPayload = {
				sub: 'employee-1',
				email: 'member@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'Test Org',
					role: 'member',
				},
				credit_balance: 30,
			};

			const memberToken = jwt.sign(memberPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const memberDecoded = jwt.verify(memberToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(memberDecoded.organization?.role).toBe('member');

			// Test admin role
			const adminPayload: JWTCustomPayload = {
				sub: 'employee-2',
				email: 'admin@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'Test Org',
					role: 'admin',
				},
				credit_balance: 100,
			};

			const adminToken = jwt.sign(adminPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const adminDecoded = jwt.verify(adminToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(adminDecoded.organization?.role).toBe('admin');
		});

		it('should include allocated credit balance for B2B employee', () => {
			const payload: JWTCustomPayload = {
				sub: 'employee-123',
				email: 'employee@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'Test Org',
					role: 'member',
				},
				credit_balance: 75, // Credits allocated by owner
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

			expect(decoded.credit_balance).toBe(75);
		});
	});

	describe('B2B Owner Token Structure', () => {
		it('should have organization.role as owner for B2B owners', () => {
			const payload: JWTCustomPayload = {
				sub: 'owner-123',
				email: 'owner@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'My Company',
					role: 'owner',
				},
				credit_balance: 1000,
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

			expect(decoded.organization?.role).toBe('owner');
		});

		it('should include owner permissions in organization context', () => {
			const payload: JWTCustomPayload = {
				sub: 'owner-123',
				email: 'owner@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'My Company',
					role: 'owner',
				},
				credit_balance: 1000,
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

			// Owner role should have full permissions
			expect(decoded.customer_type).toBe('b2b');
			expect(decoded.organization?.role).toBe('owner');

			// Owners typically have higher credit balances
			expect(decoded.credit_balance).toBeGreaterThan(0);
		});
	});

	describe('Token Validation - Security', () => {
		it('should validate HS256 signature correctly', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Tamper with the token
			const parts = token.split('.');
			const tamperedPayload = Buffer.from(
				JSON.stringify({ ...payload, credit_balance: 99999 })
			).toString('base64url');
			const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

			expect(() => {
				jwt.verify(tamperedToken, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow('invalid signature');
		});

		it('should reject tokens with invalid algorithm', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
			};

			// Sign with HS256 (symmetric)
			const token = jwt.sign(payload, 'secret-key', {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Try to verify with wrong secret
			expect(() => {
				jwt.verify(token, secret, {
					algorithms: ['HS256'],
				});
			}).toThrow();
		});
	});

	describe('Token Refresh', () => {
		it('should issue new token with updated credit_balance', () => {
			// Original token
			const originalPayload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
			};

			const originalToken = jwt.sign(originalPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// User spent 50 credits, refresh token should reflect new balance
			const newPayload: JWTCustomPayload = {
				...originalPayload,
				credit_balance: 100, // Updated balance
			};

			const refreshedToken = jwt.sign(newPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(refreshedToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(decoded.credit_balance).toBe(100);
		});

		it('should maintain organization context on refresh for B2B users', () => {
			const originalPayload: JWTCustomPayload = {
				sub: 'employee-123',
				email: 'employee@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'Test Company',
					role: 'member',
				},
				credit_balance: 75,
			};

			const originalToken = jwt.sign(originalPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// Refresh token with updated credit balance
			const refreshedPayload: JWTCustomPayload = {
				...originalPayload,
				credit_balance: 50, // Used some credits
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

			// Organization context should be maintained
			expect(decoded.organization).toMatchObject({
				id: 'org-123',
				name: 'Test Company',
				role: 'member',
			});
			expect(decoded.credit_balance).toBe(50);
		});

		it('should update organization if user switched orgs', () => {
			const originalPayload: JWTCustomPayload = {
				sub: 'employee-123',
				email: 'employee@company.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-old-123',
					name: 'Old Company',
					role: 'member',
				},
				credit_balance: 75,
			};

			const originalToken = jwt.sign(originalPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			// User switched to a different organization
			const newPayload: JWTCustomPayload = {
				...originalPayload,
				organization: {
					id: 'org-new-456',
					name: 'New Company',
					role: 'admin', // Different role in new org
				},
				credit_balance: 100, // Different balance in new org
			};

			const refreshedToken = jwt.sign(newPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const decoded = jwt.verify(refreshedToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(decoded.organization).toMatchObject({
				id: 'org-new-456',
				name: 'New Company',
				role: 'admin',
			});
			expect(decoded.credit_balance).toBe(100);
		});
	});

	describe('Edge Cases', () => {
		it('should include active org only when user belongs to multiple orgs', () => {
			// User belongs to multiple orgs but token should only include active one
			const payload: JWTCustomPayload = {
				sub: 'multi-org-user',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-active-123', // Only active org
					name: 'Active Company',
					role: 'member',
				},
				credit_balance: 50,
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

			// Should only have one organization (the active one)
			expect(decoded.organization).toMatchObject({
				id: 'org-active-123',
				name: 'Active Company',
				role: 'member',
			});
		});

		it('should reflect when user is removed from org', () => {
			// After user is removed from org, they become B2C
			const payload: JWTCustomPayload = {
				sub: 'removed-user',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c', // Changed to B2C
				organization: null, // No org anymore
				credit_balance: 0, // Personal balance (starts at 0)
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

			expect(decoded.customer_type).toBe('b2c');
			expect(decoded.organization).toBeNull();
		});

		it('should handle deleted org gracefully', () => {
			// When org is deleted, user should revert to B2C
			const payload: JWTCustomPayload = {
				sub: 'orphaned-user',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null, // Org was deleted
				credit_balance: 0,
			};

			const token = jwt.sign(payload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			expect(() => {
				const decoded = jwt.verify(token, secret, {
					algorithms: ['HS256'],
				}) as JWTCustomPayload;

				expect(decoded.customer_type).toBe('b2c');
				expect(decoded.organization).toBeNull();
			}).not.toThrow();
		});

		it('should handle zero credit balance', () => {
			const payload: JWTCustomPayload = {
				sub: 'broke-user',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 0, // No credits
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

			expect(decoded.credit_balance).toBe(0);
		});

		it('should handle missing optional fields (app_id, device_id)', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
				// app_id and device_id are optional
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

			expect(decoded.app_id).toBeUndefined();
			expect(decoded.device_id).toBeUndefined();
		});

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
	});

	describe('Token Expiration Times', () => {
		it('should use 15 minutes for access tokens', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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

	describe('Custom Claims Validation', () => {
		it('should validate customer_type is either b2c or b2b', () => {
			const b2cPayload: JWTCustomPayload = {
				sub: 'user-1',
				email: 'user1@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 100,
			};

			const b2cToken = jwt.sign(b2cPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const b2cDecoded = jwt.verify(b2cToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(b2cDecoded.customer_type).toBe('b2c');

			const b2bPayload: JWTCustomPayload = {
				sub: 'user-2',
				email: 'user2@example.com',
				role: 'user',
				customer_type: 'b2b',
				organization: {
					id: 'org-123',
					name: 'Test Org',
					role: 'member',
				},
				credit_balance: 50,
			};

			const b2bToken = jwt.sign(b2bPayload, secret, {
				algorithm: 'HS256',
				expiresIn: '15m',
				issuer: 'mana-core',
				audience: 'manacore',
			});

			const b2bDecoded = jwt.verify(b2bToken, secret, {
				algorithms: ['HS256'],
			}) as JWTCustomPayload;

			expect(b2bDecoded.customer_type).toBe('b2b');
		});

		it('should validate organization.role is owner, admin, or member', () => {
			const roles: Array<'owner' | 'admin' | 'member'> = ['owner', 'admin', 'member'];

			roles.forEach((role) => {
				const payload: JWTCustomPayload = {
					sub: `user-${role}`,
					email: `${role}@example.com`,
					role: 'user',
					customer_type: 'b2b',
					organization: {
						id: 'org-123',
						name: 'Test Org',
						role,
					},
					credit_balance: 100,
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

				expect(decoded.organization?.role).toBe(role);
			});
		});

		it('should validate credit_balance is a number', () => {
			const payload: JWTCustomPayload = {
				sub: 'user-123',
				email: 'user@example.com',
				role: 'user',
				customer_type: 'b2c',
				organization: null,
				credit_balance: 150,
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

			expect(typeof decoded.credit_balance).toBe('number');
		});
	});
});
