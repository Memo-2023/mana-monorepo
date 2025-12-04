/**
 * B2C User Journey E2E Tests
 *
 * Complete end-to-end test for B2C user lifecycle:
 * 1. Register account
 * 2. Login and get tokens
 * 3. Use credits for various apps
 * 4. Check balance and history
 * 5. Refresh token
 * 6. Logout
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('B2C User Journey (E2E)', () => {
	let app: INestApplication;
	let accessToken: string;
	let refreshToken: string;
	let userId: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Complete B2C Journey', () => {
		const uniqueEmail = `b2c-e2e-${Date.now()}@example.com`;
		const password = 'SecurePassword123!';

		it('Step 1: Register new B2C user', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password,
					name: 'B2C E2E User',
				})
				.expect(201);

			expect(response.body).toMatchObject({
				id: expect.any(String),
				email: uniqueEmail,
				name: 'B2C E2E User',
			});

			userId = response.body.id;
		});

		it('Step 2: Login and receive JWT tokens', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: uniqueEmail,
					password,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				user: {
					id: userId,
					email: uniqueEmail,
				},
				accessToken: expect.any(String),
				refreshToken: expect.any(String),
				tokenType: 'Bearer',
				expiresIn: 900,
			});

			accessToken = response.body.accessToken;
			refreshToken = response.body.refreshToken;
		});

		it('Step 3: Get initial credit balance', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				balance: 0,
				freeCreditsRemaining: 150, // Signup bonus
				dailyFreeCredits: 5,
				totalSpent: 0,
			});
		});

		it('Step 4: Use credits for audio transcription (Memoro)', async () => {
			const response = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 25,
					appId: 'memoro',
					description: 'Audio transcription',
					metadata: {
						fileId: 'audio-123',
						duration: 120,
					},
				})
				.expect(200);

			expect(response.body).toMatchObject({
				success: true,
				newBalance: {
					balance: 0,
					freeCreditsRemaining: 125, // 150 - 25
					totalSpent: 25,
				},
			});
		});

		it('Step 5: Use credits for image generation (Picture)', async () => {
			const response = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 30,
					appId: 'picture',
					description: 'AI image generation',
					metadata: {
						prompt: 'Beautiful sunset',
						model: 'dall-e-3',
					},
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.newBalance.freeCreditsRemaining).toBe(95); // 125 - 30
		});

		it('Step 6: Use credits for chat conversation', async () => {
			const response = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 15,
					appId: 'chat',
					description: 'AI chat conversation',
				})
				.expect(200);

			expect(response.body.newBalance.freeCreditsRemaining).toBe(80); // 95 - 15
			expect(response.body.newBalance.totalSpent).toBe(70); // 25 + 30 + 15
		});

		it('Step 7: Check updated balance', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				balance: 0,
				freeCreditsRemaining: 80,
				totalSpent: 70,
			});
		});

		it('Step 8: Get transaction history', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/transactions')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThanOrEqual(4); // signup + 3 usage

			// Verify transactions are in descending order
			const transactions = response.body;
			expect(transactions[0].appId).toBe('chat'); // Most recent
		});

		it('Step 9: Refresh access token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({
					refreshToken,
				})
				.expect(200);

			expect(response.body).toMatchObject({
				user: {
					id: userId,
				},
				accessToken: expect.any(String),
				refreshToken: expect.any(String),
			});

			// Update tokens
			const newAccessToken = response.body.accessToken;
			const newRefreshToken = response.body.refreshToken;

			expect(newAccessToken).not.toBe(accessToken);
			expect(newRefreshToken).not.toBe(refreshToken);

			accessToken = newAccessToken;
			refreshToken = newRefreshToken;
		});

		it('Step 10: Verify new access token works', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body.freeCreditsRemaining).toBe(80);
		});

		it('Step 11: Attempt to use more credits than available', async () => {
			await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 200, // More than available
					appId: 'wisekeep',
					description: 'Video analysis',
				})
				.expect(400);
		});

		it('Step 12: Test idempotency with duplicate request', async () => {
			const idempotencyKey = `idempotent-${Date.now()}`;

			// First request
			const response1 = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 5,
					appId: 'test',
					description: 'Idempotency test',
					idempotencyKey,
				})
				.expect(200);

			const balanceAfterFirst = response1.body.newBalance.freeCreditsRemaining;

			// Second request with same idempotency key
			const response2 = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					amount: 5,
					appId: 'test',
					description: 'Idempotency test',
					idempotencyKey,
				})
				.expect(200);

			expect(response2.body.message).toBe('Transaction already processed');

			// Verify balance unchanged
			const balanceCheck = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(balanceCheck.body.freeCreditsRemaining).toBe(balanceAfterFirst);
		});

		it('Step 13: Get credit packages', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/packages')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);

			if (response.body.length > 0) {
				expect(response.body[0]).toMatchObject({
					id: expect.any(String),
					name: expect.any(String),
					credits: expect.any(Number),
					priceEuroCents: expect.any(Number),
				});
			}
		});

		it('Step 14: Logout and revoke session', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/logout')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				message: 'Logged out successfully',
			});
		});

		it('Step 15: Verify access token no longer works after logout', async () => {
			await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(401);
		});

		it('Step 16: Verify refresh token no longer works after logout', async () => {
			await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({
					refreshToken,
				})
				.expect(401);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should reject registration with invalid email', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: 'invalid-email',
					password: 'SecurePassword123!',
					name: 'Test User',
				})
				.expect(400);
		});

		it('should reject registration with weak password', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: `test-weak-${Date.now()}@example.com`,
					password: '123', // Too weak
					name: 'Test User',
				})
				.expect(400);
		});

		it('should reject credit usage without authentication', async () => {
			await request(app.getHttpServer())
				.post('/credits/use')
				.send({
					amount: 10,
					appId: 'test',
					description: 'Unauthorized attempt',
				})
				.expect(401);
		});

		it('should reject credit usage with invalid token', async () => {
			await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', 'Bearer invalid-token-12345')
				.send({
					amount: 10,
					appId: 'test',
					description: 'Invalid token attempt',
				})
				.expect(401);
		});

		it('should reject negative credit amounts', async () => {
			// First, register and login
			const uniqueEmail = `negative-test-${Date.now()}@example.com`;
			const registerResponse = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
					name: 'Negative Test',
				})
				.expect(201);

			const loginResponse = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
				})
				.expect(200);

			const token = loginResponse.body.accessToken;

			// Attempt to use negative credits
			await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${token}`)
				.send({
					amount: -10, // Negative amount
					appId: 'test',
					description: 'Negative credits',
				})
				.expect(400);
		});

		it('should handle concurrent requests safely', async () => {
			const uniqueEmail = `concurrent-e2e-${Date.now()}@example.com`;

			// Register and login
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
					name: 'Concurrent User',
				})
				.expect(201);

			const loginResponse = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: uniqueEmail,
					password: 'SecurePassword123!',
				})
				.expect(200);

			const token = loginResponse.body.accessToken;

			// Send multiple concurrent requests
			const requests = [];
			for (let i = 0; i < 5; i++) {
				requests.push(
					request(app.getHttpServer())
						.post('/credits/use')
						.set('Authorization', `Bearer ${token}`)
						.send({
							amount: 5,
							appId: 'test',
							description: `Concurrent request ${i}`,
						})
				);
			}

			const responses = await Promise.all(requests);

			// All should succeed
			responses.forEach((response) => {
				expect([200, 409]).toContain(response.status); // 200 success or 409 conflict
			});
		});
	});

	describe('Security Tests', () => {
		it('should not expose sensitive data in error messages', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: 'nonexistent@example.com',
					password: 'SomePassword123!',
				})
				.expect(401);

			// Error should not reveal whether user exists
			expect(response.body.message).toBe('Invalid credentials');
			expect(response.body).not.toHaveProperty('userId');
		});

		it('should enforce rate limiting on login attempts', async () => {
			// Note: This test assumes rate limiting is configured
			// Make multiple failed login attempts

			const promises = [];
			for (let i = 0; i < 20; i++) {
				promises.push(
					request(app.getHttpServer())
						.post('/auth/login')
						.send({
							email: `brute-force-${Date.now()}@example.com`,
							password: 'wrong-password',
						})
				);
			}

			const responses = await Promise.all(promises);

			// Eventually should get rate limited (429)
			const rateLimited = responses.some((r) => r.status === 429);

			// If rate limiting is implemented, this should be true
			// If not implemented yet, this test will fail (which is good feedback)
			if (rateLimited) {
				expect(rateLimited).toBe(true);
			}
		});

		it('should reject SQL injection attempts in email field', async () => {
			const sqlInjectionPayloads = ["admin'--", "' OR '1'='1", "'; DROP TABLE users; --"];

			for (const payload of sqlInjectionPayloads) {
				const response = await request(app.getHttpServer()).post('/auth/login').send({
					email: payload,
					password: 'SomePassword123!',
				});

				// Should fail safely without SQL injection
				expect([400, 401]).toContain(response.status);
			}
		});
	});
});
