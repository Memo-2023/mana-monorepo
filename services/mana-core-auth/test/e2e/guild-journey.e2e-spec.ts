/**
 * Guild (Gilde) Journey E2E Tests
 *
 * Complete end-to-end test for Guild workflows:
 * 1. Create guild with pool
 * 2. Invite and onboard members
 * 3. Fund guild pool from personal balance
 * 4. Members use credits from pool
 * 5. Spending limits enforcement
 * 6. Credit source routing (personal vs guild)
 * 7. Member removal and access control
 * 8. Edge cases (concurrent, idempotency, insufficient funds)
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Guild Journey (E2E)', () => {
	let app: INestApplication;
	let gildenmeisterToken: string;
	let memberToken: string;
	let gildenmesterId: string;
	let memberId: string;
	let guildId: string;

	const uniqueTimestamp = Date.now();

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

	// =========================================================================
	// Phase 1: Guild Creation
	// =========================================================================

	describe('Phase 1: Guild Creation', () => {
		const ownerEmail = `gildenmeister-${uniqueTimestamp}@test.com`;
		const ownerPassword = 'SecurePassword123!';

		it('should register the Gildenmeister', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: ownerEmail,
					password: ownerPassword,
					name: 'Gildenmeister Max',
				})
				.expect(201);

			gildenmesterId = response.body.id;
		});

		it('should login as Gildenmeister', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: ownerEmail,
					password: ownerPassword,
				})
				.expect(200);

			gildenmeisterToken = response.body.accessToken;
			expect(gildenmeisterToken).toBeDefined();
		});

		it('should create a guild via POST /gilden', async () => {
			const response = await request(app.getHttpServer())
				.post('/gilden')
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({
					name: `Testgilde ${uniqueTimestamp}`,
				})
				.expect(201);

			expect(response.body.gilde).toBeDefined();
			expect(response.body.gilde.name).toBe(`Testgilde ${uniqueTimestamp}`);
			expect(response.body.pool).toBeDefined();
			expect(response.body.pool.balance).toBe(0);

			guildId = response.body.gilde.id;
		});

		it('should show guild pool balance of 0', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/balance`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				balance: 0,
				totalFunded: 0,
				totalSpent: 0,
			});
		});

		it('should list the guild in user guilds', async () => {
			const response = await request(app.getHttpServer())
				.get('/gilden')
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body.guilds).toBeDefined();
			expect(response.body.guilds.length).toBeGreaterThanOrEqual(1);

			const guild = response.body.guilds.find((g: any) => g.gilde.id === guildId);
			expect(guild).toBeDefined();
		});
	});

	// =========================================================================
	// Phase 2: Member Management
	// =========================================================================

	describe('Phase 2: Member Management', () => {
		const memberEmail = `gildenmitglied-${uniqueTimestamp}@test.com`;
		const memberPassword = 'SecurePassword123!';

		it('should register a potential member', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: memberEmail,
					password: memberPassword,
					name: 'Mitglied Anna',
				})
				.expect(201);

			memberId = response.body.id;
		});

		it('should login as member', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: memberEmail,
					password: memberPassword,
				})
				.expect(200);

			memberToken = response.body.accessToken;
		});

		it('should not allow non-member to access guild pool', async () => {
			await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/balance`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(403);
		});

		it('should invite member to guild', async () => {
			const response = await request(app.getHttpServer())
				.post(`/gilden/${guildId}/invite`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({
					email: memberEmail,
					role: 'member',
				})
				.expect(201);

			expect(response.body).toBeDefined();
		});

		it('should list pending invitations for member', async () => {
			const response = await request(app.getHttpServer())
				.get('/auth/invitations')
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			expect(response.body.length).toBeGreaterThanOrEqual(1);

			const invitation = response.body.find((inv: any) => inv.organizationId === guildId);
			expect(invitation).toBeDefined();

			// Accept the invitation
			await request(app.getHttpServer())
				.post('/gilden/accept-invitation')
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					invitationId: invitation.id,
				})
				.expect(201);
		});

		it('should now allow member to access guild pool', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/balance`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			expect(response.body.balance).toBe(0);
		});
	});

	// =========================================================================
	// Phase 3: Pool Funding
	// =========================================================================

	describe('Phase 3: Pool Funding', () => {
		it('should give Gildenmeister some personal credits (simulated)', async () => {
			// Purchase credits to personal balance first
			// We simulate this by directly adding credits via the use endpoint workaround
			// In a real scenario, this would be a Stripe purchase
			const { ConfigService } = await import('@nestjs/config');
			const configService = app.get(ConfigService);
			const databaseUrl = configService.get<string>('database.url');
			const { getDb } = await import('../../src/db/connection');
			const { balances } = await import('../../src/db/schema');
			const { eq } = await import('drizzle-orm');
			const db = getDb(databaseUrl!);

			await db
				.update(balances)
				.set({
					balance: 5000,
					totalEarned: 5000,
				})
				.where(eq(balances.userId, gildenmesterId));

			// Verify
			const response = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body.balance).toBe(5000);
		});

		it('should fund guild pool from personal balance', async () => {
			const response = await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/fund`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({
					amount: 2000,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.personalBalance.balance).toBe(3000); // 5000 - 2000
			expect(response.body.poolBalance.balance).toBe(2000);
		});

		it('should verify guild pool balance increased', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/balance`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body).toMatchObject({
				balance: 2000,
				totalFunded: 2000,
				totalSpent: 0,
			});
		});

		it('should verify personal balance decreased', async () => {
			const response = await request(app.getHttpServer())
				.get('/credits/balance')
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body.balance).toBe(3000);
		});

		it('should prevent member from funding (not owner/admin)', async () => {
			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/fund`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({ amount: 100 })
				.expect(403);
		});

		it('should prevent funding more than personal balance', async () => {
			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/fund`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({ amount: 10000 })
				.expect(400);
		});
	});

	// =========================================================================
	// Phase 4: Credit Usage from Pool
	// =========================================================================

	describe('Phase 4: Credit Usage from Pool', () => {
		it('should allow member to use credits from guild pool', async () => {
			const response = await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 50,
					appId: 'chat',
					description: 'AI chat conversation',
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.newBalance.balance).toBe(1950); // 2000 - 50
			expect(response.body.transaction.userId).toBe(memberId);
			expect(response.body.transaction.organizationId).toBe(guildId);
		});

		it('should allow Gildenmeister to use credits from pool too', async () => {
			const response = await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({
					amount: 100,
					appId: 'picture',
					description: 'Image generation',
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.newBalance.balance).toBe(1850); // 1950 - 100
		});

		it('should track guild transactions', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/transactions`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			// Owner should see all transactions (funding + 2 usages)
			expect(response.body.length).toBeGreaterThanOrEqual(3);

			const usageTransactions = response.body.filter((t: any) => t.type === 'usage');
			expect(usageTransactions.length).toBe(2);
		});

		it('should only show own transactions to members', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/transactions`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			// Member should only see their own transactions
			response.body.forEach((t: any) => {
				expect(t.userId).toBe(memberId);
			});
		});
	});

	// =========================================================================
	// Phase 5: Credit Source Routing
	// =========================================================================

	describe('Phase 5: Credit Source Routing', () => {
		it('should route to guild pool via POST /credits/use with creditSource', async () => {
			const response = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 25,
					appId: 'todo',
					description: 'Task creation',
					creditSource: {
						type: 'guild',
						guildId,
					},
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.newBalance.balance).toBe(1825); // 1850 - 25
		});

		it('should use personal balance without creditSource', async () => {
			// Give member some personal credits first
			const { ConfigService } = await import('@nestjs/config');
			const configService = app.get(ConfigService);
			const databaseUrl = configService.get<string>('database.url');
			const { getDb } = await import('../../src/db/connection');
			const { balances } = await import('../../src/db/schema');
			const { eq } = await import('drizzle-orm');
			const db = getDb(databaseUrl!);

			await db
				.update(balances)
				.set({ balance: 100, totalEarned: 100 })
				.where(eq(balances.userId, memberId));

			const response = await request(app.getHttpServer())
				.post('/credits/use')
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 10,
					appId: 'todo',
					description: 'Personal task',
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			// Should have deducted from personal balance, not guild
			expect(response.body.newBalance.balance).toBe(90); // 100 - 10
		});
	});

	// =========================================================================
	// Phase 6: Spending Limits
	// =========================================================================

	describe('Phase 6: Spending Limits', () => {
		it('should set daily spending limit for member', async () => {
			const response = await request(app.getHttpServer())
				.put(`/credits/guild/${guildId}/members/${memberId}/limits`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({
					dailyLimit: 100,
					monthlyLimit: 500,
				})
				.expect(200);

			expect(response.body.dailyLimit).toBe(100);
			expect(response.body.monthlyLimit).toBe(500);
		});

		it('should get member spending limits', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/members/${memberId}/limits`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			expect(response.body.dailyLimit).toBe(100);
			expect(response.body.monthlyLimit).toBe(500);
		});

		it('should get member spending summary', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/members/${memberId}/spending`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			expect(response.body.dailyLimit).toBe(100);
			expect(response.body.monthlyLimit).toBe(500);
			expect(response.body.spentToday).toBeGreaterThanOrEqual(0);
			expect(response.body.dailyRemaining).toBeDefined();
		});

		it('should enforce daily spending limit', async () => {
			// Member already spent 75 today (50 + 25 from guild pool)
			// Daily limit is 100, so spending 50 more should fail
			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 50,
					appId: 'chat',
					description: 'Should exceed daily limit',
				})
				.expect(400);
		});

		it('should prevent member from setting their own limits', async () => {
			await request(app.getHttpServer())
				.put(`/credits/guild/${guildId}/members/${memberId}/limits`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({ dailyLimit: 99999 })
				.expect(403);
		});
	});

	// =========================================================================
	// Phase 7: Edge Cases & Security
	// =========================================================================

	describe('Phase 7: Edge Cases & Security', () => {
		it('should prevent using more credits than pool has', async () => {
			// Remove limit first so we can test pool balance
			await request(app.getHttpServer())
				.put(`/credits/guild/${guildId}/members/${memberId}/limits`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({ dailyLimit: null, monthlyLimit: null })
				.expect(200);

			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 999999,
					appId: 'chat',
					description: 'Way too much',
				})
				.expect(400);
		});

		it('should support idempotent guild credit usage', async () => {
			const idempotencyKey = `guild-idem-${Date.now()}`;

			const response1 = await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 10,
					appId: 'test',
					description: 'Idempotency test',
					idempotencyKey,
				})
				.expect(200);

			// Second request with same key
			const response2 = await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${memberToken}`)
				.send({
					amount: 10,
					appId: 'test',
					description: 'Idempotency test',
					idempotencyKey,
				})
				.expect(200);

			expect(response2.body.message).toBe('Transaction already processed');
		});

		it('should prevent non-member from using guild credits', async () => {
			// Register a random user not in the guild
			const randomEmail = `random-${Date.now()}@test.com`;

			await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: randomEmail,
					password: 'SecurePassword123!',
					name: 'Random User',
				})
				.expect(201);

			const loginRes = await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: randomEmail, password: 'SecurePassword123!' })
				.expect(200);

			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.set('Authorization', `Bearer ${loginRes.body.accessToken}`)
				.send({
					amount: 10,
					appId: 'chat',
					description: 'Unauthorized',
				})
				.expect(403);
		});

		it('should prevent funding with negative amount', async () => {
			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/fund`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.send({ amount: -100 })
				.expect(400);
		});

		it('should require authentication for all guild endpoints', async () => {
			await request(app.getHttpServer()).get(`/credits/guild/${guildId}/balance`).expect(401);

			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/fund`)
				.send({ amount: 100 })
				.expect(401);

			await request(app.getHttpServer())
				.post(`/credits/guild/${guildId}/use`)
				.send({ amount: 10, appId: 'chat', description: 'test' })
				.expect(401);
		});

		it('should handle concurrent guild spending safely', async () => {
			const requests = [];
			for (let i = 0; i < 3; i++) {
				requests.push(
					request(app.getHttpServer())
						.post(`/credits/guild/${guildId}/use`)
						.set('Authorization', `Bearer ${memberToken}`)
						.send({
							amount: 5,
							appId: 'test',
							description: `Concurrent ${i}`,
						})
				);
			}

			const responses = await Promise.all(requests);

			// All should either succeed or conflict
			responses.forEach((response) => {
				expect([200, 409]).toContain(response.status);
			});
		});
	});

	// =========================================================================
	// Phase 8: Final State Verification
	// =========================================================================

	describe('Phase 8: Final State', () => {
		it('should show accurate final guild pool balance', async () => {
			const response = await request(app.getHttpServer())
				.get(`/credits/guild/${guildId}/balance`)
				.set('Authorization', `Bearer ${gildenmeisterToken}`)
				.expect(200);

			expect(response.body.balance).toBeGreaterThanOrEqual(0);
			expect(response.body.totalFunded).toBe(2000);
			expect(response.body.totalSpent).toBeGreaterThan(0);

			console.log('\n=== Guild Journey Summary ===');
			console.log('Pool Balance:', response.body);
			console.log('===========================\n');
		});
	});
});
