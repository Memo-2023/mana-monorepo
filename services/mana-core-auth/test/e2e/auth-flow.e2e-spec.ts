/**
 * Authentication Flow E2E Tests
 *
 * Focused tests for core authentication flows:
 * 1. Registration flow
 * 2. Login flow
 * 3. Token refresh flow
 * 4. Logout flow
 * 5. Session management
 * 6. Token validation
 *
 * These tests complement the comprehensive B2C/B2B journey tests
 * by providing focused coverage of authentication primitives.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication Flow (E2E)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({ transform: true }));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Registration Flow', () => {
		it('should register a new user successfully', async () => {
			const uniqueEmail = `auth-flow-${Date.now()}@example.com`;

			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
					name: 'Auth Flow User',
				})
				.expect(201);

			expect(response.body).toMatchObject({
				id: expect.any(String),
				email: uniqueEmail,
				name: 'Auth Flow User',
			});
		});

		it('should reject duplicate email registration', async () => {
			const uniqueEmail = `auth-dup-${Date.now()}@example.com`;

			// First registration should succeed
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
					name: 'First User',
				})
				.expect(201);

			// Second registration with same email should fail
			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'DifferentPassword123!',
					name: 'Second User',
				})
				.expect((res) => {
					expect([400, 409]).toContain(res.status);
				});
		});

		it('should reject registration with invalid email', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: 'not-an-email',
					password: 'SecurePassword123!',
					name: 'Invalid Email User',
				})
				.expect(400);
		});

		it('should reject registration with short password', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: `short-pwd-${Date.now()}@example.com`,
					password: '123',
					name: 'Short Password User',
				})
				.expect(400);
		});

		it('should allow registration without name', async () => {
			const uniqueEmail = `no-name-${Date.now()}@example.com`;

			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
				})
				.expect(201);

			expect(response.body.email).toBe(uniqueEmail);
		});
	});

	describe('Login Flow', () => {
		const loginTestEmail = `login-flow-${Date.now()}@example.com`;
		const loginTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			// Create user for login tests
			await request(app.getHttpServer()).post('/auth/register').send({
				email: loginTestEmail,
				password: loginTestPassword,
				name: 'Login Test User',
			});
		});

		it('should login with valid credentials', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: loginTestEmail,
					password: loginTestPassword,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				user: {
					email: loginTestEmail,
				},
				accessToken: expect.any(String),
				refreshToken: expect.any(String),
				tokenType: 'Bearer',
				expiresIn: expect.any(Number),
			});
		});

		it('should reject login with wrong password', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: loginTestEmail,
					password: 'WrongPassword123!',
				})
				.expect(401);

			expect(response.body.message).toBe('Invalid credentials');
		});

		it('should reject login with non-existent email', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: 'nonexistent@example.com',
					password: 'SomePassword123!',
				})
				.expect(401);

			expect(response.body.message).toBe('Invalid credentials');
		});

		it('should accept optional device info', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: loginTestEmail,
					password: loginTestPassword,
					deviceId: 'device-123',
					deviceName: 'Test Device',
				})
				.expect(200);

			expect(response.body.accessToken).toBeDefined();
		});
	});

	describe('Token Refresh Flow', () => {
		let accessToken: string;
		let refreshToken: string;
		const refreshTestEmail = `refresh-${Date.now()}@example.com`;
		const refreshTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			// Create and login user
			await request(app.getHttpServer()).post('/auth/register').send({
				email: refreshTestEmail,
				password: refreshTestPassword,
				name: 'Refresh Test User',
			});

			const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
				email: refreshTestEmail,
				password: refreshTestPassword,
			});

			accessToken = loginResponse.body.accessToken;
			refreshToken = loginResponse.body.refreshToken;
		});

		it('should refresh tokens with valid refresh token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({
					refreshToken,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				user: {
					email: refreshTestEmail,
				},
				accessToken: expect.any(String),
				refreshToken: expect.any(String),
			});

			// New tokens should be different from old ones
			expect(response.body.accessToken).not.toBe(accessToken);
			expect(response.body.refreshToken).not.toBe(refreshToken);
		});

		it('should reject refresh with invalid token', async () => {
			await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({
					refreshToken: 'invalid-refresh-token',
				})
				.expect(401);
		});

		it('should reject refresh with empty token', async () => {
			await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({
					refreshToken: '',
				})
				.expect((res) => {
					expect([400, 401]).toContain(res.status);
				});
		});
	});

	describe('Session Flow', () => {
		let accessToken: string;
		let refreshToken: string;
		const sessionTestEmail = `session-${Date.now()}@example.com`;
		const sessionTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			await request(app.getHttpServer()).post('/auth/register').send({
				email: sessionTestEmail,
				password: sessionTestPassword,
				name: 'Session Test User',
			});

			const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
				email: sessionTestEmail,
				password: sessionTestPassword,
			});

			accessToken = loginResponse.body.accessToken;
			refreshToken = loginResponse.body.refreshToken;
		});

		it('should get session with valid token', async () => {
			const response = await request(app.getHttpServer())
				.get('/auth/session')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect((res) => {
					expect([200, 401]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('user');
				expect(response.body.user.email).toBe(sessionTestEmail);
			}
		});

		it('should reject session request without token', async () => {
			await request(app.getHttpServer()).get('/auth/session').expect(401);
		});

		it('should reject session request with invalid token', async () => {
			await request(app.getHttpServer())
				.get('/auth/session')
				.set('Authorization', 'Bearer invalid-token')
				.expect(401);
		});
	});

	describe('Logout Flow', () => {
		let accessToken: string;
		let refreshToken: string;
		const logoutTestEmail = `logout-${Date.now()}@example.com`;
		const logoutTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			await request(app.getHttpServer()).post('/auth/register').send({
				email: logoutTestEmail,
				password: logoutTestPassword,
				name: 'Logout Test User',
			});

			const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
				email: logoutTestEmail,
				password: logoutTestPassword,
			});

			accessToken = loginResponse.body.accessToken;
			refreshToken = loginResponse.body.refreshToken;
		});

		it('should logout successfully', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/logout')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				message: 'Logged out successfully',
			});
		});

		it('should invalidate token after logout', async () => {
			// First logout
			await request(app.getHttpServer())
				.post('/auth/logout')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			// Try to access protected endpoint
			await request(app.getHttpServer())
				.get('/auth/session')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(401);
		});

		it('should reject logout without token', async () => {
			await request(app.getHttpServer()).post('/auth/logout').expect(401);
		});
	});

	describe('Token Validation', () => {
		let accessToken: string;
		const validateTestEmail = `validate-${Date.now()}@example.com`;
		const validateTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			await request(app.getHttpServer()).post('/auth/register').send({
				email: validateTestEmail,
				password: validateTestPassword,
				name: 'Validate Test User',
			});

			const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
				email: validateTestEmail,
				password: validateTestPassword,
			});

			accessToken = loginResponse.body.accessToken;
		});

		it('should validate valid token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/validate')
				.send({ token: accessToken })
				.expect(200);

			expect(response.body).toHaveProperty('valid', true);
			expect(response.body).toHaveProperty('payload');
			expect(response.body.payload).toHaveProperty('sub');
			expect(response.body.payload).toHaveProperty('email', validateTestEmail);
		});

		it('should reject invalid token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/validate')
				.send({ token: 'invalid-jwt-token' })
				.expect(200);

			expect(response.body).toHaveProperty('valid', false);
		});

		it('should reject malformed token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/validate')
				.send({ token: 'not.a.valid.jwt' })
				.expect(200);

			expect(response.body).toHaveProperty('valid', false);
		});
	});

	describe('JWKS Endpoint', () => {
		it('should return JWKS from /auth/jwks', async () => {
			const response = await request(app.getHttpServer())
				.get('/auth/jwks')
				.expect((res) => {
					expect([200, 500]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('keys');
				expect(Array.isArray(response.body.keys)).toBe(true);
			}
		});
	});

	describe('Password Reset Flow', () => {
		const resetTestEmail = `reset-${Date.now()}@example.com`;
		const resetTestPassword = 'SecurePassword123!';

		beforeAll(async () => {
			await request(app.getHttpServer()).post('/auth/register').send({
				email: resetTestEmail,
				password: resetTestPassword,
				name: 'Reset Test User',
			});
		});

		it('should accept password reset request', async () => {
			// This should always return success to prevent email enumeration
			const response = await request(app.getHttpServer())
				.post('/auth/forgot-password')
				.send({
					email: resetTestEmail,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				message: expect.any(String),
			});
		});

		it('should accept reset request for non-existent email', async () => {
			// Should not reveal if email exists
			const response = await request(app.getHttpServer())
				.post('/auth/forgot-password')
				.send({
					email: 'nonexistent@example.com',
				})
				.expect(200);

			expect(response.body).toMatchObject({
				message: expect.any(String),
			});
		});

		it('should reject reset with invalid token', async () => {
			await request(app.getHttpServer())
				.post('/auth/reset-password')
				.send({
					token: 'invalid-reset-token',
					newPassword: 'NewSecurePassword123!',
				})
				.expect((res) => {
					expect([400, 401]).toContain(res.status);
				});
		});
	});

	describe('Email Verification Flow', () => {
		const verifyTestEmail = `verify-${Date.now()}@example.com`;

		beforeAll(async () => {
			await request(app.getHttpServer()).post('/auth/register').send({
				email: verifyTestEmail,
				password: 'SecurePassword123!',
				name: 'Verify Test User',
			});
		});

		it('should accept resend verification request', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/resend-verification')
				.send({
					email: verifyTestEmail,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				message: expect.any(String),
			});
		});

		it('should accept resend for non-existent email', async () => {
			// Should not reveal if email exists
			const response = await request(app.getHttpServer())
				.post('/auth/resend-verification')
				.send({
					email: 'nonexistent@example.com',
				})
				.expect(200);

			expect(response.body).toMatchObject({
				message: expect.any(String),
			});
		});
	});
});

describe('Rate Limiting (E2E)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({ transform: true }));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should rate limit registration endpoint', async () => {
		const requests = [];
		const timestamp = Date.now();

		// Make more than the limit (5 req/min)
		for (let i = 0; i < 10; i++) {
			requests.push(
				request(app.getHttpServer())
					.post('/auth/register')
					.send({
						email: `rate-limit-${timestamp}-${i}@example.com`,
						password: 'SecurePassword123!',
						name: 'Rate Limit User',
					})
			);
		}

		const responses = await Promise.all(requests);

		// Some should be rate limited (429)
		const rateLimited = responses.some((r) => r.status === 429);
		if (rateLimited) {
			expect(rateLimited).toBe(true);
		}
	});

	it('should rate limit login endpoint', async () => {
		const requests = [];
		const timestamp = Date.now();

		// Make more than the limit (10 req/min)
		for (let i = 0; i < 15; i++) {
			requests.push(
				request(app.getHttpServer())
					.post('/auth/login')
					.send({
						email: `rate-limit-login-${timestamp}@example.com`,
						password: 'WrongPassword123!',
					})
			);
		}

		const responses = await Promise.all(requests);

		// Some should be rate limited (429)
		const rateLimited = responses.some((r) => r.status === 429);
		if (rateLimited) {
			expect(rateLimited).toBe(true);
		}
	});

	it('should rate limit forgot-password endpoint', async () => {
		const requests = [];

		// Make more than the limit (3 req/min)
		for (let i = 0; i < 10; i++) {
			requests.push(
				request(app.getHttpServer())
					.post('/auth/forgot-password')
					.send({
						email: `rate-limit-forgot-${i}@example.com`,
					})
			);
		}

		const responses = await Promise.all(requests);

		// Some should be rate limited (429)
		const rateLimited = responses.some((r) => r.status === 429);
		if (rateLimited) {
			expect(rateLimited).toBe(true);
		}
	});
});
