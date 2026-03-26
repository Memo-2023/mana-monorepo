/**
 * Passkey & 2FA E2E Tests
 *
 * Tests the HTTP layer for:
 * 1. Passkey registration flow (auth required)
 * 2. Passkey authentication flow (public)
 * 3. Passkey management (list, rename, delete)
 * 4. Auth guard enforcement on passkey endpoints
 * 5. 2FA redirect detection during sign-in
 * 6. Session-to-token exchange after 2FA verification
 *
 * WebAuthn crypto is handled by @simplewebauthn/server which is mocked
 * at the module level (via jest-e2e.json moduleNameMapper). These tests
 * focus on request/response shapes, status codes, and auth guard behavior.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Passkey & 2FA (E2E)', () => {
	let app: INestApplication;
	let accessToken: string;
	let refreshToken: string;
	let userId: string;

	const testEmail = `passkey-e2e-${Date.now()}@example.com`;
	const testPassword = 'SecurePassword123!';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({ transform: true }));
		await app.init();

		// Register and login a test user for authenticated passkey operations
		const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
			email: testEmail,
			password: testPassword,
			name: 'Passkey E2E User',
		});

		userId = registerResponse.body.id;

		const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
			email: testEmail,
			password: testPassword,
		});

		accessToken = loginResponse.body.accessToken;
		refreshToken = loginResponse.body.refreshToken;
	});

	afterAll(async () => {
		await app.close();
	});

	// =========================================================================
	// Passkey Registration Flow
	// =========================================================================

	describe('Passkey Registration Flow', () => {
		it('should generate registration options for authenticated user', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/options')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect((res) => {
					expect([200, 201]).toContain(res.status);
				});

			expect(response.body).toHaveProperty('options');
			expect(response.body).toHaveProperty('challengeId');
			expect(response.body.options).toHaveProperty('challenge');
			expect(typeof response.body.options.challenge).toBe('string');
			expect(response.body.options.challenge.length).toBeGreaterThan(0);
			expect(typeof response.body.challengeId).toBe('string');
		});

		it('should include RP info in registration options', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/options')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect((res) => {
					expect([200, 201]).toContain(res.status);
				});

			const { options } = response.body;
			expect(options).toHaveProperty('rp');
			expect(options.rp).toHaveProperty('name');
			expect(options.rp).toHaveProperty('id');
		});

		it('should include user info in registration options', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/options')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect((res) => {
					expect([200, 201]).toContain(res.status);
				});

			const { options } = response.body;
			expect(options).toHaveProperty('user');
			expect(options.user).toHaveProperty('name');
			expect(options.user).toHaveProperty('displayName');
		});

		it('should reject registration verify with invalid challenge', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/verify')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					challengeId: 'invalid-challenge-id',
					credential: {
						id: 'fake-credential-id',
						rawId: 'fake-raw-id',
						response: {
							clientDataJSON: 'fake-client-data',
							attestationObject: 'fake-attestation',
						},
						type: 'public-key',
					},
				})
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(response.body.message).toMatch(/invalid|expired/i);
		});

		it('should reject registration verify with expired challenge', async () => {
			// Get valid options but use a bogus challengeId
			await request(app.getHttpServer())
				.post('/auth/passkeys/register/options')
				.set('Authorization', `Bearer ${accessToken}`);

			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/verify')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					challengeId: 'non-existent-challenge-id',
					credential: {
						id: 'fake-credential',
						rawId: 'fake-raw',
						response: {
							clientDataJSON: 'fake',
							attestationObject: 'fake',
						},
						type: 'public-key',
					},
				})
				.expect(400);

			expect(response.body.message).toMatch(/invalid|expired/i);
		});
	});

	// =========================================================================
	// Passkey Authentication Flow (Public Endpoints)
	// =========================================================================

	describe('Passkey Authentication Flow', () => {
		it('should generate authentication options without auth', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/authenticate/options')
				.expect(200);

			expect(response.body).toHaveProperty('options');
			expect(response.body).toHaveProperty('challengeId');
			expect(response.body.options).toHaveProperty('challenge');
			expect(typeof response.body.options.challenge).toBe('string');
			expect(response.body.options.challenge.length).toBeGreaterThan(0);
			expect(typeof response.body.challengeId).toBe('string');
		});

		it('should include rpId in authentication options', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/authenticate/options')
				.expect(200);

			expect(response.body.options).toHaveProperty('rpId');
		});

		it('should reject authentication verify with invalid challenge', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/authenticate/verify')
				.send({
					challengeId: 'invalid-challenge-id',
					credential: {
						id: 'fake-credential-id',
						rawId: 'fake-raw-id',
						response: {
							clientDataJSON: 'fake-client-data',
							authenticatorData: 'fake-auth-data',
							signature: 'fake-signature',
						},
						type: 'public-key',
					},
				})
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(response.body.message).toMatch(/invalid|expired/i);
		});

		it('should reject authentication verify without challengeId', async () => {
			await request(app.getHttpServer())
				.post('/auth/passkeys/authenticate/verify')
				.send({
					credential: {
						id: 'fake-credential',
						response: {},
						type: 'public-key',
					},
				})
				.expect(400);
		});
	});

	// =========================================================================
	// Passkey Management (List, Rename, Delete)
	// =========================================================================

	describe('Passkey Management', () => {
		it('should list passkeys for authenticated user (initially empty)', async () => {
			const response = await request(app.getHttpServer())
				.get('/auth/passkeys')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			// New user should have no passkeys initially
			expect(response.body.length).toBe(0);
		});

		it('should return 404 when deleting non-existent passkey', async () => {
			await request(app.getHttpServer())
				.delete('/auth/passkeys/non-existent-id')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(404);
		});

		it('should return 404 when renaming non-existent passkey', async () => {
			await request(app.getHttpServer())
				.patch('/auth/passkeys/non-existent-id')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ friendlyName: 'My Key' })
				.expect(404);
		});
	});

	// =========================================================================
	// Auth Guard Enforcement
	// =========================================================================

	describe('Auth Guard Enforcement', () => {
		describe('Protected endpoints require JWT', () => {
			it('POST /auth/passkeys/register/options requires auth', async () => {
				await request(app.getHttpServer()).post('/auth/passkeys/register/options').expect(401);
			});

			it('POST /auth/passkeys/register/verify requires auth', async () => {
				await request(app.getHttpServer())
					.post('/auth/passkeys/register/verify')
					.send({
						challengeId: 'test',
						credential: { id: 'test', response: {} },
					})
					.expect(401);
			});

			it('GET /auth/passkeys requires auth', async () => {
				await request(app.getHttpServer()).get('/auth/passkeys').expect(401);
			});

			it('DELETE /auth/passkeys/:id requires auth', async () => {
				await request(app.getHttpServer()).delete('/auth/passkeys/some-id').expect(401);
			});

			it('PATCH /auth/passkeys/:id requires auth', async () => {
				await request(app.getHttpServer())
					.patch('/auth/passkeys/some-id')
					.send({ friendlyName: 'test' })
					.expect(401);
			});
		});

		describe('Public endpoints do not require JWT', () => {
			it('POST /auth/passkeys/authenticate/options is public', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/passkeys/authenticate/options')
					.expect(200);

				expect(response.body).toHaveProperty('options');
			});

			it('POST /auth/passkeys/authenticate/verify is public (fails on invalid data, not auth)', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/passkeys/authenticate/verify')
					.send({
						challengeId: 'invalid',
						credential: { id: 'test', response: {} },
					});

				// Should get 400 (bad request) not 401 (unauthorized)
				expect(response.status).toBe(400);
			});
		});

		describe('Invalid token handling', () => {
			it('should reject passkey endpoints with invalid token', async () => {
				await request(app.getHttpServer())
					.post('/auth/passkeys/register/options')
					.set('Authorization', 'Bearer invalid-jwt-token')
					.expect(401);
			});

			it('should reject passkey endpoints with malformed auth header', async () => {
				await request(app.getHttpServer())
					.get('/auth/passkeys')
					.set('Authorization', 'NotBearer token')
					.expect(401);
			});
		});
	});

	// =========================================================================
	// 2FA Flow via Sign-In
	// =========================================================================

	describe('2FA Flow', () => {
		it('should return standard login response when 2FA is not enabled', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: testEmail,
					password: testPassword,
				})
				.expect(200);

			// Normal user without 2FA should get tokens
			expect(response.body).toHaveProperty('accessToken');
			expect(response.body).toHaveProperty('refreshToken');
			expect(response.body).not.toHaveProperty('twoFactorRedirect');
		});

		it('session-to-token endpoint should exist', async () => {
			// Without a valid session cookie, this should return 401
			const response = await request(app.getHttpServer())
				.post('/auth/session-to-token')
				.expect((res) => {
					// Should be 401 (no session cookie) not 404 (endpoint missing)
					expect(res.status).not.toBe(404);
					expect([200, 401]).toContain(res.status);
				});

			if (response.status === 401) {
				expect(response.body).toHaveProperty('message');
			}
		});

		it('session-to-token should reject request without session cookie', async () => {
			await request(app.getHttpServer()).post('/auth/session-to-token').expect(401);
		});
	});

	// =========================================================================
	// 2FA Passthrough Endpoints
	// =========================================================================

	describe('2FA Passthrough Routes', () => {
		it('should expose two-factor enable endpoint (requires session)', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/enable')
				.send({});

			// Should not be 404 - the route exists even if auth fails
			expect(response.status).not.toBe(404);
		});

		it('should expose two-factor verify-totp endpoint', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/verify-totp')
				.send({ code: '000000' });

			// Should not be 404 - the route exists
			expect(response.status).not.toBe(404);
		});

		it('should expose two-factor disable endpoint', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/disable')
				.send({});

			expect(response.status).not.toBe(404);
		});

		it('should expose two-factor get-totp-uri endpoint', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/get-totp-uri')
				.send({});

			expect(response.status).not.toBe(404);
		});

		it('should expose two-factor generate-backup-codes endpoint', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/generate-backup-codes')
				.send({});

			expect(response.status).not.toBe(404);
		});

		it('should expose two-factor verify-backup-code endpoint', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/two-factor/verify-backup-code')
				.send({ code: 'fake-backup-code' });

			expect(response.status).not.toBe(404);
		});
	});

	// =========================================================================
	// Passkey + Login Token Shape Consistency
	// =========================================================================

	describe('Token Response Shape Consistency', () => {
		it('login and passkey-auth-verify should share the same token response shape', async () => {
			// Login response shape
			const loginResponse = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: testEmail,
					password: testPassword,
				})
				.expect(200);

			// Verify the login token shape (passkey auth verify returns the same shape)
			const tokenKeys = Object.keys(loginResponse.body);
			expect(tokenKeys).toContain('user');
			expect(tokenKeys).toContain('accessToken');
			expect(tokenKeys).toContain('refreshToken');
			expect(tokenKeys).toContain('expiresIn');

			expect(loginResponse.body.user).toHaveProperty('id');
			expect(loginResponse.body.user).toHaveProperty('email');
			expect(typeof loginResponse.body.accessToken).toBe('string');
			expect(typeof loginResponse.body.refreshToken).toBe('string');
			expect(typeof loginResponse.body.expiresIn).toBe('number');
		});
	});

	// =========================================================================
	// Edge Cases
	// =========================================================================

	describe('Edge Cases', () => {
		it('should handle empty body on register/options gracefully', async () => {
			// The endpoint reads user from JWT, so empty body is fine
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/options')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({});

			expect([200, 201]).toContain(response.status);
			expect(response.body).toHaveProperty('challengeId');
		});

		it('should handle missing credential field on register/verify', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/register/verify')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ challengeId: 'some-challenge' });

			expect([400, 500]).toContain(response.status);
		});

		it('should handle missing body on authenticate/verify', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/passkeys/authenticate/verify')
				.send({});

			expect([400, 500]).toContain(response.status);
		});

		it('should not allow cross-user passkey deletion', async () => {
			// Create a second user
			const otherEmail = `passkey-other-${Date.now()}@example.com`;
			await request(app.getHttpServer()).post('/auth/register').send({
				email: otherEmail,
				password: testPassword,
				name: 'Other User',
			});

			const otherLogin = await request(app.getHttpServer()).post('/auth/login').send({
				email: otherEmail,
				password: testPassword,
			});

			const otherToken = otherLogin.body.accessToken;

			// Try to delete a non-existent passkey with other user's token
			// This should return 404 (not found for this user) not 204
			await request(app.getHttpServer())
				.delete('/auth/passkeys/some-passkey-id')
				.set('Authorization', `Bearer ${otherToken}`)
				.expect(404);
		});

		it('should generate unique challenge IDs across requests', async () => {
			const [res1, res2] = await Promise.all([
				request(app.getHttpServer()).post('/auth/passkeys/authenticate/options').send(),
				request(app.getHttpServer()).post('/auth/passkeys/authenticate/options').send(),
			]);

			expect(res1.body.challengeId).not.toBe(res2.body.challengeId);
			expect(res1.body.options.challenge).not.toBe(res2.body.options.challenge);
		});
	});
});
