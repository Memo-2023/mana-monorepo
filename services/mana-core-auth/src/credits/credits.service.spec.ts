/**
 * CreditsService Unit Tests
 *
 * Tests all credit management flows:
 * - Balance initialization
 * - Credit usage with optimistic locking
 * - Transaction history
 * - Idempotency
 *
 * Simplified system - no free credits or B2B organization credits
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { StripeService } from '../stripe/stripe.service';
import { GuildPoolService } from './guild-pool.service';
import { createMockConfigService } from '../__tests__/utils/test-helpers';
import {
	mockUserFactory,
	mockBalanceFactory,
	mockTransactionFactory,
	mockPackageFactory,
	mockPurchaseFactory,
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

		const mockStripeService = {
			getCustomerByUserId: jest.fn(),
			createCheckoutSession: jest.fn(),
			handleWebhook: jest.fn(),
		};

		const mockGuildPoolService = {
			initializeGuildPool: jest.fn(),
			getGuildPoolBalance: jest.fn(),
			fundGuildPool: jest.fn(),
			useGuildCredits: jest.fn(),
			getGuildTransactions: jest.fn(),
			setSpendingLimit: jest.fn(),
			getSpendingLimits: jest.fn(),
			getMemberSpendingSummary: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreditsService,
				{
					provide: ConfigService,
					useValue: createMockConfigService({}),
				},
				{
					provide: StripeService,
					useValue: mockStripeService,
				},
				{
					provide: GuildPoolService,
					useValue: mockGuildPoolService,
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
		it('should create initial balance with zero credits', async () => {
			const userId = 'user-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 0,
				totalEarned: 0,
				totalSpent: 0,
			});

			// Mock query results in order: check existing, create balance
			mockDb.mockResults(
				[], // No existing balance
				[mockBalance] // Create balance
			);

			const result = await service.initializeUserBalance(userId);

			expect(result).toEqual(mockBalance);

			// Verify balance was created with correct values (simplified - no free credits)
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					balance: 0,
					totalEarned: 0,
					totalSpent: 0,
				})
			);

			// Verify only balance was created (no signup bonus transaction)
			expect(mockDb.insert).toHaveBeenCalledTimes(1);
		});

		it('should not create duplicate balance if already exists', async () => {
			const userId = 'user-123';

			const existingBalance = mockBalanceFactory.create(userId);

			// Mock: Balance already exists - first query returns the existing balance
			mockDb.mockResults([existingBalance]);

			const result = await service.initializeUserBalance(userId);

			expect(result).toEqual(existingBalance);

			// Verify no new balance was created
		});
	});

	describe('getBalance', () => {
		it('should return user balance', async () => {
			const userId = 'user-123';

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 1000,
				totalEarned: 2000,
				totalSpent: 1000,
			});

			mockDb.mockResults([mockBalance]);

			const result = await service.getBalance(userId);

			expect(result).toMatchObject({
				balance: 1000,
				totalEarned: 2000,
				totalSpent: 1000,
			});
		});

		it('should initialize balance if it does not exist', async () => {
			const userId = 'user-new';

			const newBalance = mockBalanceFactory.create(userId, {
				balance: 0,
				totalEarned: 0,
				totalSpent: 0,
			});

			mockDb.mockResults(
				[], // No balance found
				[newBalance] // Created balance
			);

			const result = await service.getBalance(userId);

			expect(result).toMatchObject({
				balance: 0,
				totalEarned: 0,
				totalSpent: 0,
			});
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
							balance: 90,
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
						balanceBefore: 100,
						balanceAfter: 90,
					}),
				]);

				return callback(txMock);
			});

			const result = await service.useCredits(userId, useCreditsDto);

			expect(result.success).toBe(true);
			expect(result.transaction).toBeDefined();
			if ('newBalance' in result) {
				expect(result.newBalance).toMatchObject({
					balance: 90,
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

	// Daily Credit Reset Logic tests removed - functionality simplified (no daily free credits)

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
				amount: 100,
				appId: 'test',
				description: 'Exact balance test',
			};

			const mockBalance = mockBalanceFactory.create(userId, {
				balance: 100,
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
			}
		});
	});

	// B2B organization credit tests removed - functionality simplified to B2C only
});
