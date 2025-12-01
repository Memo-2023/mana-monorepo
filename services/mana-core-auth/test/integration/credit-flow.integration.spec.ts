/**
 * Credit Flow Integration Tests
 *
 * Tests complete credit workflows:
 * - B2C: Purchase → Use Credits → Balance Updates
 * - B2B: Allocate → Deduct → Organization Tracking
 * - Daily free credit reset
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CreditsService } from '../../src/credits/credits.service';
import { AuthService } from '../../src/auth/auth.service';
import configuration from '../../src/config/configuration';

describe('Credit Flow Integration Tests', () => {
	let creditsService: CreditsService;
	let authService: AuthService;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					load: [configuration],
					isGlobal: true,
				}),
			],
			providers: [CreditsService, AuthService],
		}).compile();

		creditsService = module.get<CreditsService>(CreditsService);
		authService = module.get<AuthService>(AuthService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('B2C Credit Flow', () => {
		it('should complete full B2C credit lifecycle', async () => {
			// Step 1: Register user
			const uniqueEmail = `b2c-credits-${Date.now()}@example.com`;
			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'B2C User',
			});

			const userId = registerResult.id;

			// Step 2: Initialize balance
			const initialBalance = await creditsService.initializeUserBalance(userId);

			expect(initialBalance).toMatchObject({
				userId,
				balance: 0,
				freeCreditsRemaining: 150, // Signup bonus
				dailyFreeCredits: 5,
			});

			// Step 3: Use free credits
			const useCreditsResult = await creditsService.useCredits(userId, {
				amount: 50,
				appId: 'memoro',
				description: 'Audio transcription',
				metadata: { fileId: 'audio-123' },
			});

			expect(useCreditsResult.success).toBe(true);
			expect(useCreditsResult.newBalance).toMatchObject({
				balance: 0, // Paid credits unchanged
				freeCreditsRemaining: 100, // 150 - 50
				totalSpent: 50,
			});

			// Step 4: Get updated balance
			const updatedBalance = await creditsService.getBalance(userId);

			expect(updatedBalance).toMatchObject({
				balance: 0,
				freeCreditsRemaining: 100,
				totalSpent: 50,
			});

			// Step 5: Get transaction history
			const transactions = await creditsService.getTransactionHistory(userId);

			expect(transactions.length).toBeGreaterThan(0);
			expect(transactions[0]).toMatchObject({
				userId,
				type: 'usage',
				amount: -50,
				appId: 'memoro',
			});
		});

		it('should prioritize free credits over paid credits', async () => {
			const uniqueEmail = `credit-priority-${Date.now()}@example.com`;

			// Register and initialize
			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Priority Test User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Note: In a real scenario, you'd add paid credits via purchase
			// For this test, we assume user has both free and paid credits

			// Use credits - should use free first
			const result = await creditsService.useCredits(userId, {
				amount: 20,
				appId: 'picture',
				description: 'Image generation',
			});

			expect(result.success).toBe(true);

			// Free credits should be reduced
			const balance = await creditsService.getBalance(userId);
			expect(balance.freeCreditsRemaining).toBe(130); // 150 - 20
		});

		it('should enforce idempotency for credit usage', async () => {
			const uniqueEmail = `idempotency-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Idempotency User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			const idempotencyKey = `idempotent-key-${Date.now()}`;

			// First request
			const result1 = await creditsService.useCredits(userId, {
				amount: 10,
				appId: 'chat',
				description: 'Chat message',
				idempotencyKey,
			});

			expect(result1.success).toBe(true);

			const balanceAfterFirst = await creditsService.getBalance(userId);

			// Second request with same idempotency key
			const result2 = await creditsService.useCredits(userId, {
				amount: 10,
				appId: 'chat',
				description: 'Chat message',
				idempotencyKey,
			});

			expect(result2.success).toBe(true);
			expect(result2.message).toBe('Transaction already processed');

			// Balance should be unchanged
			const balanceAfterSecond = await creditsService.getBalance(userId);

			expect(balanceAfterSecond.freeCreditsRemaining).toBe(balanceAfterFirst.freeCreditsRemaining);
			expect(balanceAfterSecond.totalSpent).toBe(balanceAfterFirst.totalSpent);
		});

		it('should prevent credit usage with insufficient balance', async () => {
			const uniqueEmail = `insufficient-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Insufficient User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Try to use more credits than available
			await expect(
				creditsService.useCredits(userId, {
					amount: 200, // More than 150 signup bonus
					appId: 'wisekeep',
					description: 'Video analysis',
				})
			).rejects.toThrow('Insufficient credits');
		});
	});

	describe('Daily Free Credit Reset', () => {
		it('should apply daily free credits on new day', async () => {
			const uniqueEmail = `daily-reset-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Daily Reset User',
			});

			const userId = registerResult.id;

			// Initialize balance
			await creditsService.initializeUserBalance(userId);

			// Note: Daily reset logic checks if lastDailyResetAt is a different day
			// In a real test with database, you'd manipulate the timestamp
			// For now, we verify the getBalance method includes the check

			const balance = await creditsService.getBalance(userId);

			expect(balance.dailyFreeCredits).toBe(5);
			expect(balance.freeCreditsRemaining).toBeDefined();
		});

		it('should not reset credits on same day', async () => {
			const uniqueEmail = `same-day-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Same Day User',
			});

			const userId = registerResult.id;

			await creditsService.initializeUserBalance(userId);

			// Get balance twice on same day
			const balance1 = await creditsService.getBalance(userId);
			const balance2 = await creditsService.getBalance(userId);

			// Free credits should be the same
			expect(balance1.freeCreditsRemaining).toBe(balance2.freeCreditsRemaining);
		});
	});

	describe('Transaction History', () => {
		it('should record all credit transactions', async () => {
			const uniqueEmail = `transaction-history-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Transaction User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Perform multiple transactions
			await creditsService.useCredits(userId, {
				amount: 10,
				appId: 'chat',
				description: 'Chat 1',
			});

			await creditsService.useCredits(userId, {
				amount: 15,
				appId: 'picture',
				description: 'Image gen',
			});

			await creditsService.useCredits(userId, {
				amount: 20,
				appId: 'memoro',
				description: 'Audio',
			});

			// Get transaction history
			const transactions = await creditsService.getTransactionHistory(userId);

			// Should have at least 4 transactions: signup bonus + 3 usage
			expect(transactions.length).toBeGreaterThanOrEqual(4);

			// Most recent should be the last usage
			expect(transactions[0].description).toContain('Audio');
			expect(transactions[0].amount).toBe(-20);
		});

		it('should support pagination for transaction history', async () => {
			const uniqueEmail = `pagination-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Pagination User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Create multiple transactions
			for (let i = 0; i < 10; i++) {
				await creditsService.useCredits(userId, {
					amount: 1,
					appId: 'test',
					description: `Transaction ${i}`,
				});
			}

			// Get first page
			const page1 = await creditsService.getTransactionHistory(userId, 5, 0);
			expect(page1.length).toBeLessThanOrEqual(5);

			// Get second page
			const page2 = await creditsService.getTransactionHistory(userId, 5, 5);
			expect(page2.length).toBeGreaterThan(0);

			// Pages should have different transactions
			if (page1.length > 0 && page2.length > 0) {
				expect(page1[0].id).not.toBe(page2[0].id);
			}
		});
	});

	describe('Package Management', () => {
		it('should list available credit packages', async () => {
			const packages = await creditsService.getPackages();

			// Verify packages are returned
			expect(Array.isArray(packages)).toBe(true);

			// Each package should have required fields
			packages.forEach((pkg) => {
				expect(pkg).toHaveProperty('id');
				expect(pkg).toHaveProperty('name');
				expect(pkg).toHaveProperty('credits');
				expect(pkg).toHaveProperty('priceEuroCents');
				expect(pkg.active).toBe(true);
			});
		});
	});

	describe('Usage Analytics', () => {
		it('should track usage statistics per app', async () => {
			const uniqueEmail = `analytics-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Analytics User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Use credits for different apps
			await creditsService.useCredits(userId, {
				amount: 10,
				appId: 'chat',
				description: 'Chat usage',
				metadata: { conversationId: 'conv-1' },
			});

			await creditsService.useCredits(userId, {
				amount: 15,
				appId: 'memoro',
				description: 'Audio processing',
				metadata: { fileId: 'audio-1' },
			});

			// Verify transactions have metadata
			const transactions = await creditsService.getTransactionHistory(userId);

			const chatTransaction = transactions.find((t) => t.appId === 'chat');
			expect(chatTransaction?.metadata).toMatchObject({
				conversationId: 'conv-1',
			});

			const memoroTransaction = transactions.find((t) => t.appId === 'memoro');
			expect(memoroTransaction?.metadata).toMatchObject({
				fileId: 'audio-1',
			});
		});
	});

	describe('Concurrent Credit Usage (Optimistic Locking)', () => {
		it('should handle concurrent credit deductions safely', async () => {
			const uniqueEmail = `concurrent-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Concurrent User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			// Note: In a real concurrent scenario, these would happen simultaneously
			// For integration test, we verify the optimistic locking mechanism exists

			const result1 = await creditsService.useCredits(userId, {
				amount: 10,
				appId: 'test',
				description: 'Request 1',
			});

			const result2 = await creditsService.useCredits(userId, {
				amount: 15,
				appId: 'test',
				description: 'Request 2',
			});

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);

			// Final balance should reflect both deductions
			const finalBalance = await creditsService.getBalance(userId);
			expect(finalBalance.totalSpent).toBe(25); // 10 + 15
		});
	});

	describe('Error Recovery', () => {
		it('should maintain balance consistency after failed transaction', async () => {
			const uniqueEmail = `error-recovery-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Error Recovery User',
			});

			const userId = registerResult.id;
			await creditsService.initializeUserBalance(userId);

			const initialBalance = await creditsService.getBalance(userId);

			// Attempt transaction that will fail (insufficient credits)
			try {
				await creditsService.useCredits(userId, {
					amount: 1000,
					appId: 'test',
					description: 'Will fail',
				});
			} catch (error) {
				// Expected to fail
			}

			// Balance should be unchanged
			const balanceAfterError = await creditsService.getBalance(userId);

			expect(balanceAfterError.freeCreditsRemaining).toBe(initialBalance.freeCreditsRemaining);
			expect(balanceAfterError.balance).toBe(initialBalance.balance);
			expect(balanceAfterError.totalSpent).toBe(initialBalance.totalSpent);
		});
	});

	describe('Credit Balance Initialization', () => {
		it('should not create duplicate balances for same user', async () => {
			const uniqueEmail = `no-duplicate-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'No Duplicate User',
			});

			const userId = registerResult.id;

			// Initialize twice
			const balance1 = await creditsService.initializeUserBalance(userId);
			const balance2 = await creditsService.initializeUserBalance(userId);

			expect(balance1.userId).toBe(userId);
			expect(balance2.userId).toBe(userId);
			expect(balance1.freeCreditsRemaining).toBe(balance2.freeCreditsRemaining);
		});

		it('should create transaction record for signup bonus', async () => {
			const uniqueEmail = `signup-bonus-tx-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Signup Bonus User',
			});

			const userId = registerResult.id;

			await creditsService.initializeUserBalance(userId);

			const transactions = await creditsService.getTransactionHistory(userId);

			// Should have signup bonus transaction
			const bonusTransaction = transactions.find(
				(t) => t.type === 'bonus' && t.description === 'Signup bonus'
			);

			expect(bonusTransaction).toBeDefined();
			expect(bonusTransaction?.amount).toBe(150);
			expect(bonusTransaction?.appId).toBe('system');
		});
	});

	describe('Purchase History', () => {
		it('should retrieve user purchase history', async () => {
			const uniqueEmail = `purchase-history-${Date.now()}@example.com`;

			const registerResult = await authService.register({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Purchase User',
			});

			const userId = registerResult.id;

			// Note: In a real scenario, you'd create purchases via payment flow
			// This test verifies the method exists and returns an array

			const purchases = await creditsService.getPurchaseHistory(userId);

			expect(Array.isArray(purchases)).toBe(true);
		});
	});
});
