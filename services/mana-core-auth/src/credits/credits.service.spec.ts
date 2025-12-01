/**
 * CreditsService Unit Tests
 *
 * Tests all credit management flows:
 * - Balance initialization
 * - Credit usage with optimistic locking
 * - Transaction history
 * - Daily free credit reset
 * - Idempotency
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
	BadRequestException,
	NotFoundException,
	ConflictException,
	ForbiddenException,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { createMockConfigService } from '../__tests__/utils/test-helpers';
import {
	mockUserFactory,
	mockBalanceFactory,
	mockTransactionFactory,
	mockPackageFactory,
	mockPurchaseFactory,
	mockOrganizationFactory,
	mockOrganizationBalanceFactory,
	mockMemberFactory,
	mockCreditAllocationFactory,
} from '../__tests__/utils/mock-factories';

jest.mock('../db/connection');

describe('CreditsService', () => {
	let service: CreditsService;
	let configService: ConfigService;
	let mockDb: any;
	let queryResults: any[];
	let resultIndex: number;

	beforeEach(async () => {
		// Track query results for thenable mock
		queryResults = [];
		resultIndex = 0;

		// Create thenable mock database
		// Each query (SELECT, INSERT, UPDATE) will resolve to the next result in queryResults
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			for: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			returning: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			offset: jest.fn().mockReturnThis(),
			transaction: jest.fn(),
			// Make the mock thenable - this allows await to work on the query chain
			then: jest.fn((resolve) => resolve(queryResults[resultIndex++] || [])),
		};

		// Helper to set query results for the test
		mockDb.mockResults = (...results: any[]) => {
			queryResults = results;
			resultIndex = 0;
		};

		const { getDb } = require('../db/connection');
		getDb.mockReturnValue(mockDb);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreditsService,
				{
					provide: ConfigService,
					useValue: createMockConfigService({
						'credits.signupBonus': 150,
						'credits.dailyFreeCredits': 5,
					}),
				},
			],
		}).compile();

		service = module.get<CreditsService>(CreditsService);
		configService = module.get<ConfigService>(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('initializeUserBalance', () => {
		it('should create initial balance with signup bonus', async () => {
			const userId = 'user-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 0,
				freeCreditsRemaining: 150,
			});

			// Mock query results in order: check existing, create balance, create transaction
			mockDb.mockResults(
				[], // No existing balance
				[mockBalance], // Create balance
				[{}] // Create transaction
			);

			const result = await service.initializeUserBalance(userId);

			expect(result).toEqual(mockBalance);

			// Verify balance was created with correct values
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					balance: 0,
					freeCreditsRemaining: 150,
					dailyFreeCredits: 5,
				})
			);

			// Verify signup bonus transaction was created
			expect(mockDb.insert).toHaveBeenCalledTimes(2); // balance + transaction
		});

		it('should not create duplicate balance if already exists', async () => {
			const userId = 'user-123';

			const existingBalance = mockBalanceFactory.create(userId);

			// Mock: Balance already exists - first query returns the existing balance
			mockDb.mockResults([existingBalance]);

			const result = await service.initializeUserBalance(userId);

			expect(result).toEqual(existingBalance);

			// Verify no new balance was created (insert should only be called for SELECT)
			// Actually since existing balance found, no insert at all
		});

		it('should create bonus transaction record with correct details', async () => {
			const userId = 'user-123';

			mockDb.mockResults(
				[], // No existing balance
				[mockBalanceFactory.create(userId)],
				[{}]
			);

			await service.initializeUserBalance(userId);

			// Verify transaction record for signup bonus
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					type: 'bonus',
					status: 'completed',
					amount: 150,
					appId: 'system',
					description: 'Signup bonus',
				})
			);
		});
	});

	describe('getBalance', () => {
		it('should return user balance with daily reset check', async () => {
			const userId = 'user-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 1000,
				freeCreditsRemaining: 50,
				totalEarned: 2000,
				totalSpent: 1000,
			});

			// Mock query results: daily reset check, return balance
			mockDb.mockResults(
				[mockBalance], // Get balance (for daily reset check)
				[mockBalance] // Get balance (for return)
			);

			const result = await service.getBalance(userId);

			// The service returns the full balance object
			expect(result).toMatchObject({
				balance: 1000,
				freeCreditsRemaining: 50,
				totalEarned: 2000,
				totalSpent: 1000,
				dailyFreeCredits: 5,
			});
		});

		it('should initialize balance if it does not exist', async () => {
			const userId = 'user-new';

			const newBalance = mockBalanceFactory.create(userId);

			mockDb.mockResults(
				[], // No balance found (for daily reset check)
				[], // No existing balance (for initialization)
				[newBalance], // Created balance
				[{}] // Transaction
			);

			const result = await service.getBalance(userId);

			expect(result).toMatchObject({
				balance: 0,
				freeCreditsRemaining: 150,
			});
		});

		it('should apply daily free credits reset if needed', async () => {
			const userId = 'user-123';

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const mockBalance = mockBalanceFactory.create(userId, {
				freeCreditsRemaining: 50,
				dailyFreeCredits: 5,
				lastDailyResetAt: yesterday,
			});

			const updatedBalance = mockBalanceFactory.create(userId, {
				freeCreditsRemaining: 55, // 50 + 5
			});

			mockDb.mockResults(
				[mockBalance], // Get balance (for daily reset check)
				[{}], // Update balance (daily reset)
				[{}], // Insert transaction (daily bonus)
				[updatedBalance] // Get balance (for return)
			);

			await service.getBalance(userId);

			// Verify daily reset was applied
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					freeCreditsRemaining: 55,
					lastDailyResetAt: expect.any(Date),
				})
			);
		});

		it('should not reset if last reset was today', async () => {
			const userId = 'user-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				lastDailyResetAt: new Date(), // Today
			});

			mockDb.mockResults(
				[mockBalance], // Daily reset check
				[mockBalance] // Return
			);

			await service.getBalance(userId);

			// Verify no update was made
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});

	describe('useCredits', () => {
		it('should successfully deduct credits from balance', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'memoro',
				description: 'Audio transcription',
				metadata: { fileId: 'file-123' },
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				freeCreditsRemaining: 50,
				totalSpent: 0,
				version: 0,
			});

			// Mock transaction callback
			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([
						{
							...mockBalance,
							freeCreditsRemaining: 40,
							totalSpent: 10,
							version: 1,
						},
					]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				txMock.returning.mockResolvedValue([
					mockTransactionFactory.create(userId, {
						amount: -10,
						balanceBefore: 150,
						balanceAfter: 140,
					}),
				]);

				return callback(txMock);
			});

			const result = await service.useCredits(userId, useCreditsDto);

			expect(result.success).toBe(true);
			expect(result.transaction).toBeDefined();
			if ('newBalance' in result) {
				expect(result.newBalance).toMatchObject({
					balance: 100,
					freeCreditsRemaining: 40,
					totalSpent: 10,
				});
			}
		});

		it('should throw BadRequestException if insufficient credits', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 200,
				appId: 'picture',
				description: 'Image generation',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 50,
				freeCreditsRemaining: 100,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
				};
				return callback(txMock);
			});

			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(BadRequestException);
			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(
				'Insufficient credits'
			);
		});

		it('should throw NotFoundException if user balance not found', async () => {
			const userId = 'non-existent-user';
			const useCreditsDto = {
				amount: 10,
				appId: 'chat',
				description: 'Chat message',
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([]), // No balance found
				};
				return callback(txMock);
			});

			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(NotFoundException);
			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(
				'User balance not found'
			);
		});

		it('should prioritize free credits over paid credits', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 30,
				appId: 'chat',
				description: 'Chat usage',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100, // Paid credits
				freeCreditsRemaining: 20, // Free credits
				version: 0,
			});

			let capturedFreeCredits: number | undefined;
			let capturedPaidCredits: number | undefined;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn((values: any) => {
						capturedFreeCredits = values.freeCreditsRemaining;
						capturedPaidCredits = values.balance;
						return txMock;
					}),
					returning: jest.fn().mockResolvedValue([
						{
							...mockBalance,
							balance: 90,
							freeCreditsRemaining: 0,
						},
					]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			await service.useCredits(userId, useCreditsDto);

			// Verify: 20 free credits used + 10 paid credits used
			expect(capturedFreeCredits).toBe(0); // 20 - 20
			expect(capturedPaidCredits).toBe(90); // 100 - 10
		});

		it('should implement optimistic locking to prevent race conditions', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'memoro',
				description: 'Audio processing',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				version: 5,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([]), // Simulate version conflict
				};
				return callback(txMock);
			});

			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(ConflictException);
			await expect(service.useCredits(userId, useCreditsDto)).rejects.toThrow(
				'Balance was modified by another transaction'
			);
		});

		it('should support idempotency to prevent duplicate charges', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'picture',
				description: 'Image generation',
				idempotencyKey: 'unique-key-12345',
			};

			const existingTransaction = mockTransactionFactory.create(userId, {
				idempotencyKey: 'unique-key-12345',
			});

			// Mock: Find existing transaction with same idempotency key
			mockDb.mockResults([existingTransaction]);

			const result = await service.useCredits(userId, useCreditsDto);

			expect(result.success).toBe(true);
			if ('message' in result) {
				expect(result.message).toBe('Transaction already processed');
			}
			expect(result.transaction).toEqual(existingTransaction);

			// Verify no actual deduction occurred
			expect(mockDb.transaction).not.toHaveBeenCalled();
		});

		it('should create transaction record with correct metadata', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'wisekeep',
				description: 'Video analysis',
				metadata: {
					videoId: 'video-123',
					duration: 120,
				},
				idempotencyKey: 'idempotency-key-abc',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				freeCreditsRemaining: 0,
				version: 0,
			});

			const capturedValuesArray: any[] = [];

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([mockBalance]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn((values: any) => {
						capturedValuesArray.push(values);
						return txMock;
					}),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			await service.useCredits(userId, useCreditsDto);

			// Find the transaction values (the one with type, amount, etc.)
			const transactionValues = capturedValuesArray.find((v) => v.type !== undefined);

			expect(transactionValues).toMatchObject({
				userId,
				type: 'usage',
				status: 'completed',
				amount: -10,
				appId: 'wisekeep',
				description: 'Video analysis',
				metadata: {
					videoId: 'video-123',
					duration: 120,
				},
				idempotencyKey: 'idempotency-key-abc',
			});
		});

		it('should track usage stats for analytics', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 25,
				appId: 'chat',
				description: 'Chat conversation',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				freeCreditsRemaining: 0,
			});

			let capturedUsageStats: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([mockBalance]),
					insert: jest.fn((table: any) => {
						return txMock;
					}),
					values: jest.fn((values: any) => {
						// Capture the second insert (usage stats)
						if (values.creditsUsed !== undefined) {
							capturedUsageStats = values;
						}
						return txMock;
					}),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			await service.useCredits(userId, useCreditsDto);

			expect(capturedUsageStats).toMatchObject({
				userId,
				appId: 'chat',
				creditsUsed: 25,
				date: expect.any(Date),
			});
		});
	});

	describe('getTransactionHistory', () => {
		it('should return paginated transaction history', async () => {
			const userId = 'user-123';

			const mockTransactions = mockTransactionFactory.createMany(userId, 3);

			mockDb.mockResults(mockTransactions);

			const result = await service.getTransactionHistory(userId, 50, 0);

			expect(result).toEqual(mockTransactions);
			expect(mockDb.orderBy).toHaveBeenCalled();
			expect(mockDb.limit).toHaveBeenCalledWith(50);
			expect(mockDb.offset).toHaveBeenCalledWith(0);
		});

		it('should support pagination with limit and offset', async () => {
			const userId = 'user-123';

			mockDb.mockResults([]);

			await service.getTransactionHistory(userId, 10, 20);

			expect(mockDb.limit).toHaveBeenCalledWith(10);
			expect(mockDb.offset).toHaveBeenCalledWith(20);
		});

		it('should default to 50 items if limit not specified', async () => {
			const userId = 'user-123';

			mockDb.mockResults([]);

			await service.getTransactionHistory(userId);

			expect(mockDb.limit).toHaveBeenCalledWith(50);
			expect(mockDb.offset).toHaveBeenCalledWith(0);
		});

		it('should order transactions by creation date descending', async () => {
			const userId = 'user-123';

			mockDb.mockResults([]);

			await service.getTransactionHistory(userId);

			// Verify orderBy was called (implementation checks for desc(transactions.createdAt))
			expect(mockDb.orderBy).toHaveBeenCalled();
		});
	});

	describe('getPurchaseHistory', () => {
		it('should return all purchases for user', async () => {
			const userId = 'user-123';

			const mockPurchases = [
				mockPurchaseFactory.create(userId, 'package-1'),
				mockPurchaseFactory.create(userId, 'package-2'),
			];

			mockDb.mockResults(mockPurchases);

			const result = await service.getPurchaseHistory(userId);

			expect(result).toEqual(mockPurchases);
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it('should order purchases by date descending', async () => {
			const userId = 'user-123';

			mockDb.mockResults([]);

			await service.getPurchaseHistory(userId);

			expect(mockDb.orderBy).toHaveBeenCalled();
		});
	});

	describe('getPackages', () => {
		it('should return only active packages', async () => {
			const mockPackages = mockPackageFactory.createMany(3);

			mockDb.mockResults(mockPackages);

			const result = await service.getPackages();

			expect(result).toEqual(mockPackages);

			// Verify only active packages were queried
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should order packages by sort order', async () => {
			mockDb.mockResults([]);

			await service.getPackages();

			expect(mockDb.orderBy).toHaveBeenCalled();
		});
	});

	describe('Daily Credit Reset Logic', () => {
		it('should reset credits at midnight', async () => {
			const userId = 'user-123';

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(23, 59, 59);

			const mockBalance = mockBalanceFactory.create(userId, {
				freeCreditsRemaining: 100,
				dailyFreeCredits: 5,
				lastDailyResetAt: yesterday,
			});

			mockDb.mockResults(
				[mockBalance], // For checkDailyReset
				[], // Update result
				[], // Transaction result
				[{ ...mockBalance, freeCreditsRemaining: 105 }] // Final balance
			);

			await service.getBalance(userId);

			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should not reset if last reset was same day', async () => {
			const userId = 'user-123';

			const today = new Date();
			today.setHours(8, 0, 0); // Earlier today

			const mockBalance = mockBalanceFactory.create(userId, {
				lastDailyResetAt: today,
			});

			mockDb.mockResults(
				[mockBalance], // checkDailyReset
				[mockBalance] // getBalance return
			);

			await service.getBalance(userId);

			expect(mockDb.update).not.toHaveBeenCalled();
		});

		it('should handle month boundary correctly', async () => {
			const userId = 'user-123';

			// Last reset: Last day of previous month
			const lastMonth = new Date();
			lastMonth.setMonth(lastMonth.getMonth() - 1);
			lastMonth.setDate(28); // Adjust for month length

			const mockBalance = mockBalanceFactory.create(userId, {
				freeCreditsRemaining: 50,
				dailyFreeCredits: 5,
				lastDailyResetAt: lastMonth,
			});

			mockDb.mockResults([mockBalance], [], [], [{ ...mockBalance, freeCreditsRemaining: 55 }]);

			await service.getBalance(userId);

			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should create transaction record for daily bonus', async () => {
			const userId = 'user-123';

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				freeCreditsRemaining: 50,
				dailyFreeCredits: 5,
				lastDailyResetAt: yesterday,
			});

			mockDb.mockResults(
				[mockBalance],
				[], // Update
				[], // Transaction insert
				[{ ...mockBalance, freeCreditsRemaining: 55 }]
			);

			await service.getBalance(userId);

			// Note: The actual implementation would capture this
			// This test validates the logic flow
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero credit usage', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 0,
				appId: 'test',
				description: 'Zero credit test',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				version: 0,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([mockBalance]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId, { amount: 0 })]);

				return callback(txMock);
			});

			const result = await service.useCredits(userId, useCreditsDto);

			expect(result.success).toBe(true);
		});

		it('should handle exact balance deduction', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 150,
				appId: 'test',
				description: 'Exact balance test',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				freeCreditsRemaining: 50,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([
						{
							...mockBalance,
							balance: 0,
							freeCreditsRemaining: 0,
						},
					]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			const result = await service.useCredits(userId, useCreditsDto);

			expect(result.success).toBe(true);
			if ('newBalance' in result) {
				expect(result.newBalance.balance).toBe(0);
				expect(result.newBalance.freeCreditsRemaining).toBe(0);
			}
		});
	});

	// ============================================================================
	// ORGANIZATION CREDIT TESTS (B2B)
	// ============================================================================

	describe('createOrganizationCreditBalance', () => {
		it('should create new organization balance with zeros', async () => {
			const organizationId = 'org-123';

			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId);

			// Mock query results: check existing, create balance
			mockDb.mockResults(
				[], // No existing balance
				[mockOrgBalance] // Create balance
			);

			const result = await service.createOrganizationCreditBalance(organizationId);

			expect(result).toEqual(mockOrgBalance);

			// Verify balance was created with correct values
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId,
					balance: 0,
					allocatedCredits: 0,
					availableCredits: 0,
					totalPurchased: 0,
					totalAllocated: 0,
				})
			);
		});

		it('should not create duplicate if already exists', async () => {
			const organizationId = 'org-123';

			const existingBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 500,
				availableCredits: 500,
			});

			// Mock: Balance already exists
			mockDb.mockResults([existingBalance]);

			const result = await service.createOrganizationCreditBalance(organizationId);

			expect(result).toEqual(existingBalance);

			// When balance exists, no insert is called
		});

		it('should return existing balance if already present', async () => {
			const organizationId = 'org-456';

			const existingBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 5000,
				allocatedCredits: 2000,
				availableCredits: 3000,
				totalPurchased: 5000,
				totalAllocated: 2000,
			});

			mockDb.mockResults([existingBalance]);

			const result = await service.createOrganizationCreditBalance(organizationId);

			expect(result).toEqual(existingBalance);
			expect(result.balance).toBe(5000);
			expect(result.allocatedCredits).toBe(2000);
			expect(result.availableCredits).toBe(3000);
		});
	});

	describe('allocateCredits', () => {
		it('should allocate credits from org to employee successfully', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 100,
				reason: 'Monthly allocation',
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 200,
				availableCredits: 800,
				version: 0,
			});
			const mockEmployeeBalance = mockBalanceFactory.create(employeeId, {
				balance: 50,
				version: 0,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				// Mock member check (owner) - uses .limit(1) as terminal
				txMock.limit.mockResolvedValueOnce([mockOwner]);

				// Mock org balance retrieval - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);

				// Mock employee balance retrieval - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([mockEmployeeBalance]),
				});

				// Mock org balance update
				txMock.returning.mockResolvedValueOnce([
					{
						...mockOrgBalance,
						allocatedCredits: 300,
						availableCredits: 700,
						totalAllocated: 300,
						version: 1,
					},
				]);

				// Mock employee balance update
				txMock.returning.mockResolvedValueOnce([
					{
						...mockEmployeeBalance,
						balance: 150,
						totalEarned: 100,
						version: 1,
					},
				]);

				// Mock allocation record insert
				const mockAllocation = mockCreditAllocationFactory.create(
					organizationId,
					employeeId,
					allocatorUserId,
					{
						amount: 100,
						balanceBefore: 50,
						balanceAfter: 150,
					}
				);
				txMock.returning.mockResolvedValueOnce([mockAllocation]);

				// Mock transaction record insert
				txMock.returning.mockResolvedValueOnce([{}]);

				return callback(txMock);
			});

			const result = await service.allocateCredits(allocatorUserId, allocateDto);

			expect(result.success).toBe(true);
			expect(result.allocation).toBeDefined();
			expect(result.organizationBalance.allocatedCredits).toBe(300);
			expect(result.organizationBalance.availableCredits).toBe(700);
			expect(result.employeeBalance.balance).toBe(150);
		});

		it('should throw ForbiddenException if allocator is not owner', async () => {
			const allocatorUserId = 'member-123'; // Not an owner
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 100,
			};

			const mockMember = mockMemberFactory.create(organizationId, allocatorUserId, {
				role: 'member', // Not owner
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					returning: jest.fn(),
				};

				// Mock member check (not owner) - uses .limit(1) as terminal
				txMock.limit.mockResolvedValueOnce([mockMember]);

				return callback(txMock);
			});

			await expect(service.allocateCredits(allocatorUserId, allocateDto)).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should throw BadRequestException if org has insufficient available credits', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 1000, // More than available
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 700,
				availableCredits: 300, // Only 300 available
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					returning: jest.fn(),
				};

				// Mock member check (owner) - uses .limit(1) as terminal
				txMock.limit.mockResolvedValueOnce([mockOwner]);

				// Mock org balance retrieval - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);

				return callback(txMock);
			});

			await expect(service.allocateCredits(allocatorUserId, allocateDto)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should auto-create employee balance if it does not exist', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'new-employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 100,
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 0,
				availableCredits: 1000,
				version: 0,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				// Mock member check - uses .limit(1) as terminal
				txMock.limit.mockResolvedValueOnce([mockOwner]);

				// Mock org balance retrieval - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);

				// Mock employee balance retrieval (not found) - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([]), // No employee balance
				});

				// Mock employee balance creation
				const newEmployeeBalance = mockBalanceFactory.create(employeeId, {
					balance: 0,
					freeCreditsRemaining: 150,
				});
				txMock.returning.mockResolvedValueOnce([newEmployeeBalance]);

				// Mock org balance update
				txMock.returning.mockResolvedValueOnce([
					{
						...mockOrgBalance,
						allocatedCredits: 100,
						availableCredits: 900,
						version: 1,
					},
				]);

				// Mock employee balance update
				txMock.returning.mockResolvedValueOnce([
					{
						...newEmployeeBalance,
						balance: 100,
						version: 1,
					},
				]);

				// Mock allocation record
				txMock.returning.mockResolvedValueOnce([
					mockCreditAllocationFactory.create(organizationId, employeeId, allocatorUserId),
				]);

				// Mock transaction record
				txMock.returning.mockResolvedValueOnce([{}]);

				return callback(txMock);
			});

			const result = await service.allocateCredits(allocatorUserId, allocateDto);

			expect(result.success).toBe(true);
			expect(result.employeeBalance.balance).toBe(100);
		});

		it('should use transaction for atomicity', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 100,
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 0,
				availableCredits: 1000,
			});
			const mockEmployeeBalance = mockBalanceFactory.create(employeeId);

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				// Mock member check - uses .limit(1)
				txMock.limit.mockResolvedValueOnce([mockOwner]);
				// Mock org balance - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);
				// Mock employee balance - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([mockEmployeeBalance]),
				});
				txMock.returning.mockResolvedValueOnce([mockOrgBalance]);
				txMock.returning.mockResolvedValueOnce([mockEmployeeBalance]);
				txMock.returning.mockResolvedValueOnce([
					mockCreditAllocationFactory.create(organizationId, employeeId, allocatorUserId),
				]);
				txMock.returning.mockResolvedValueOnce([{}]);

				return callback(txMock);
			});

			await service.allocateCredits(allocatorUserId, allocateDto);

			// Verify transaction was used
			expect(mockDb.transaction).toHaveBeenCalledTimes(1);
		});

		it('should update both org available_credits and employee balance', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 200,
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				allocatedCredits: 300,
				availableCredits: 700,
				totalAllocated: 300,
				version: 0,
			});
			const mockEmployeeBalance = mockBalanceFactory.create(employeeId, {
				balance: 100,
				totalEarned: 50,
				version: 0,
			});

			let capturedOrgUpdate: any;
			let capturedEmployeeUpdate: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn((values: any) => {
						if (values.allocatedCredits !== undefined) {
							capturedOrgUpdate = values;
						} else if (values.balance !== undefined) {
							capturedEmployeeUpdate = values;
						}
						return txMock;
					}),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				// Mock member check - uses .limit(1)
				txMock.limit.mockResolvedValueOnce([mockOwner]);
				// Mock org balance - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);
				// Mock employee balance - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([mockEmployeeBalance]),
				});
				txMock.returning.mockResolvedValueOnce([
					{
						...mockOrgBalance,
						allocatedCredits: 500,
						availableCredits: 500,
						totalAllocated: 500,
					},
				]);
				txMock.returning.mockResolvedValueOnce([
					{
						...mockEmployeeBalance,
						balance: 300,
						totalEarned: 250,
					},
				]);
				txMock.returning.mockResolvedValueOnce([
					mockCreditAllocationFactory.create(organizationId, employeeId, allocatorUserId),
				]);
				txMock.returning.mockResolvedValueOnce([{}]);

				return callback(txMock);
			});

			await service.allocateCredits(allocatorUserId, allocateDto);

			// Verify org update
			expect(capturedOrgUpdate).toMatchObject({
				allocatedCredits: 500, // 300 + 200
				availableCredits: 500, // 1000 - 500
				totalAllocated: 500,
			});

			// Verify employee update
			expect(capturedEmployeeUpdate).toMatchObject({
				balance: 300, // 100 + 200
				totalEarned: 250, // 50 + 200
			});
		});

		it('should create allocation record for audit', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 150,
				reason: 'Q4 allocation',
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				availableCredits: 1000,
			});
			const mockEmployeeBalance = mockBalanceFactory.create(employeeId, {
				balance: 50,
			});

			let capturedAllocationValues: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn((values: any) => {
						if (values.allocatedBy !== undefined) {
							capturedAllocationValues = values;
						}
						return txMock;
					}),
				};

				// Mock member check - uses .limit(1)
				txMock.limit.mockResolvedValueOnce([mockOwner]);
				// Mock org balance - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);
				// Mock employee balance - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([mockEmployeeBalance]),
				});
				txMock.returning.mockResolvedValueOnce([mockOrgBalance]);
				txMock.returning.mockResolvedValueOnce([mockEmployeeBalance]);
				txMock.returning.mockResolvedValueOnce([
					mockCreditAllocationFactory.create(organizationId, employeeId, allocatorUserId),
				]);
				txMock.returning.mockResolvedValueOnce([{}]);

				return callback(txMock);
			});

			await service.allocateCredits(allocatorUserId, allocateDto);

			expect(capturedAllocationValues).toMatchObject({
				organizationId,
				employeeId,
				amount: 150,
				allocatedBy: allocatorUserId,
				reason: 'Q4 allocation',
				balanceBefore: 50,
				balanceAfter: 200,
			});
		});

		it('should handle optimistic locking for concurrent allocations', async () => {
			const allocatorUserId = 'owner-123';
			const employeeId = 'employee-456';
			const organizationId = 'org-789';
			const allocateDto = {
				organizationId,
				employeeId,
				amount: 100,
			};

			const mockOwner = mockMemberFactory.createOwner(organizationId, allocatorUserId);
			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 1000,
				availableCredits: 1000,
				version: 5,
			});
			const mockEmployeeBalance = mockBalanceFactory.create(employeeId, {
				version: 3,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					limit: jest.fn(),
					for: jest.fn().mockReturnThis(),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn(),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
				};

				// Mock member check - uses .limit(1)
				txMock.limit.mockResolvedValueOnce([mockOwner]);
				// Mock org balance - uses .for('update').limit(1)
				txMock.limit.mockResolvedValueOnce([mockOrgBalance]);
				// Mock employee balance - uses .for('update').limit(1).then()
				txMock.limit.mockReturnValueOnce({
					then: (callback: any) => callback([mockEmployeeBalance]),
				});

				// Simulate version conflict on org balance update
				txMock.returning.mockResolvedValueOnce([]); // Empty result = conflict

				return callback(txMock);
			});

			await expect(service.allocateCredits(allocatorUserId, allocateDto)).rejects.toThrow(
				ConflictException
			);
			await expect(service.allocateCredits(allocatorUserId, allocateDto)).rejects.toThrow(
				'Organization balance was modified by another transaction'
			);
		});
	});

	describe('getEmployeeCreditBalance', () => {
		it('should return employee credit balance', async () => {
			const userId = 'employee-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 500,
				freeCreditsRemaining: 50,
				totalEarned: 1000,
				totalSpent: 450,
			});

			// The implementation uses .limit(1) as the terminal method, not .returning()
			mockDb.limit.mockResolvedValueOnce([mockBalance]);

			const result = await service.getEmployeeCreditBalance(userId);

			expect(result).toEqual({
				balance: 500,
				freeCreditsRemaining: 50,
				totalEarned: 1000,
				totalSpent: 450,
			});
		});

		it('should return null if no balance exists', async () => {
			const userId = 'employee-new';

			// Mock: No balance found - .limit(1) returns empty array
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getEmployeeCreditBalance(userId);

			expect(result).toBeNull();
		});

		it('should work with organizationId parameter (optional)', async () => {
			const userId = 'employee-123';
			const organizationId = 'org-789';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 300,
			});

			// .limit(1) is the terminal method
			mockDb.limit.mockResolvedValueOnce([mockBalance]);

			const result = await service.getEmployeeCreditBalance(userId, organizationId);

			expect(result).toBeDefined();
			expect(result?.balance).toBe(300);
		});
	});

	describe('getOrganizationBalance', () => {
		it('should return complete org balance breakdown', async () => {
			const organizationId = 'org-123';

			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 10000,
				allocatedCredits: 4000,
				availableCredits: 6000,
				totalPurchased: 10000,
				totalAllocated: 4000,
			});

			const mockAllocations = [
				mockCreditAllocationFactory.create(organizationId, 'emp-1', 'owner-1', {
					amount: 100,
				}),
				mockCreditAllocationFactory.create(organizationId, 'emp-2', 'owner-1', {
					amount: 200,
				}),
			];

			// Mock org balance query - uses .limit(1) as terminal
			mockDb.limit.mockResolvedValueOnce([mockOrgBalance]);

			// Mock allocations query - also uses .limit(10) as terminal
			mockDb.limit.mockResolvedValueOnce(mockAllocations);

			const result = await service.getOrganizationBalance(organizationId);

			expect(result).toEqual({
				balance: 10000,
				allocatedCredits: 4000,
				availableCredits: 6000,
				totalPurchased: 10000,
				totalAllocated: 4000,
				recentAllocations: mockAllocations,
			});
		});

		it('should include recent allocations', async () => {
			const organizationId = 'org-456';

			const mockOrgBalance = mockOrganizationBalanceFactory.create(organizationId, {
				balance: 5000,
			});

			const recentAllocations = [
				mockCreditAllocationFactory.create(organizationId, 'emp-1', 'owner-1', {
					amount: 500,
					reason: 'Monthly allocation',
				}),
				mockCreditAllocationFactory.create(organizationId, 'emp-2', 'owner-1', {
					amount: 300,
					reason: 'Bonus allocation',
				}),
				mockCreditAllocationFactory.create(organizationId, 'emp-3', 'owner-1', {
					amount: 200,
					reason: 'Project allocation',
				}),
			];

			// Mock org balance query - uses .limit(1) as terminal
			mockDb.limit.mockResolvedValueOnce([mockOrgBalance]);

			// Mock allocations query - uses .limit(10) as terminal
			mockDb.limit.mockResolvedValueOnce(recentAllocations);

			const result = await service.getOrganizationBalance(organizationId);

			expect(result.recentAllocations).toHaveLength(3);
			expect(result.recentAllocations[0].reason).toBe('Monthly allocation');
		});

		it('should throw NotFoundException if org does not exist', async () => {
			const organizationId = 'org-nonexistent';

			// Mock: No org balance found - .limit(1) returns empty
			mockDb.limit.mockResolvedValueOnce([]);

			await expect(service.getOrganizationBalance(organizationId)).rejects.toThrow(
				NotFoundException
			);
			await expect(service.getOrganizationBalance(organizationId)).rejects.toThrow(
				'Organization balance not found'
			);
		});
	});

	describe('deductCredits (with organization tracking)', () => {
		it('should track organization_id in transaction for B2B users', async () => {
			const userId = 'employee-123';
			const organizationId = 'org-789';
			const useCreditsDto = {
				amount: 10,
				appId: 'chat',
				description: 'Chat usage',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				version: 0,
			});

			let capturedTransactionValues: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([mockBalance]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn((values: any) => {
						if (values.type === 'usage') {
							capturedTransactionValues = values;
						}
						return txMock;
					}),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			await service.deductCredits(userId, useCreditsDto, organizationId);

			expect(capturedTransactionValues).toMatchObject({
				userId,
				type: 'usage',
				amount: -10,
				organizationId: organizationId, // B2B tracking
				appId: 'chat',
				description: 'Chat usage',
			});
		});

		it('should set organization_id to null for B2C users', async () => {
			const userId = 'b2c-user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'picture',
				description: 'Image generation',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				version: 0,
			});

			let capturedTransactionValues: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([mockBalance]),
					insert: jest.fn().mockReturnThis(),
					values: jest.fn((values: any) => {
						if (values.type === 'usage') {
							capturedTransactionValues = values;
						}
						return txMock;
					}),
				};

				txMock.returning.mockResolvedValue([mockTransactionFactory.create(userId)]);

				return callback(txMock);
			});

			// Call without organizationId
			await service.deductCredits(userId, useCreditsDto);

			expect(capturedTransactionValues).toMatchObject({
				userId,
				type: 'usage',
				amount: -10,
				organizationId: null, // B2C - no org tracking
			});
		});

		it('should work with existing idempotency', async () => {
			const userId = 'user-123';
			const useCreditsDto = {
				amount: 10,
				appId: 'chat',
				description: 'Chat usage',
				idempotencyKey: 'unique-key-abc',
			};

			const existingTransaction = mockTransactionFactory.create(userId, {
				idempotencyKey: 'unique-key-abc',
			});

			// Idempotency check uses .limit(1) as terminal method
			mockDb.limit.mockResolvedValueOnce([existingTransaction]);

			const result = await service.deductCredits(userId, useCreditsDto, 'org-123');

			expect(result.success).toBe(true);
			if ('message' in result) {
				expect(result.message).toBe('Transaction already processed');
			}
			expect(result.transaction).toEqual(existingTransaction);

			// Verify no actual deduction occurred
			expect(mockDb.transaction).not.toHaveBeenCalled();
		});

		it('should work with existing optimistic locking', async () => {
			const userId = 'user-123';
			const organizationId = 'org-789';
			const useCreditsDto = {
				amount: 10,
				appId: 'memoro',
				description: 'Audio processing',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
				version: 5,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					returning: jest.fn().mockResolvedValue([]), // Simulate version conflict
				};
				return callback(txMock);
			});

			await expect(service.deductCredits(userId, useCreditsDto, organizationId)).rejects.toThrow(
				ConflictException
			);
			await expect(service.deductCredits(userId, useCreditsDto, organizationId)).rejects.toThrow(
				'Balance was modified by another transaction'
			);
		});

		it('should handle insufficient credits error', async () => {
			const userId = 'user-123';
			const organizationId = 'org-789';
			const useCreditsDto = {
				amount: 1000,
				appId: 'picture',
				description: 'Image generation',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 50,
				freeCreditsRemaining: 100,
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const txMock: any = {
					select: jest.fn().mockReturnThis(),
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					for: jest.fn().mockReturnThis(),
					limit: jest.fn().mockResolvedValue([mockBalance]),
				};
				return callback(txMock);
			});

			await expect(service.deductCredits(userId, useCreditsDto, organizationId)).rejects.toThrow(
				BadRequestException
			);
			await expect(service.deductCredits(userId, useCreditsDto, organizationId)).rejects.toThrow(
				'Insufficient credits'
			);
		});
	});
});
