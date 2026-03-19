import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockUserToken,
	createMockModelPrice,
	createMockTokenTransaction,
	TEST_USER_ID,
} from '../__tests__/utils/mock-factories';
import { createMockDb } from '../__tests__/utils/mock-db';

describe('TokenService', () => {
	let service: TokenService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TokenService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<TokenService>(TokenService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getBalance', () => {
		it('should return token balance for existing user', async () => {
			const userToken = createMockUserToken({ tokenBalance: 500 });
			mockDb.where.mockResolvedValueOnce([userToken]);

			const result = await service.getBalance(TEST_USER_ID);

			expect(result).toBe(500);
		});

		it('should create user with default balance when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);
			mockDb.returning.mockResolvedValueOnce([]); // insert

			const result = await service.getBalance(TEST_USER_ID);

			expect(result).toBe(1000);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should return 0 when balance is null', async () => {
			const userToken = createMockUserToken({ tokenBalance: null as any });
			mockDb.where.mockResolvedValueOnce([userToken]);

			const result = await service.getBalance(TEST_USER_ID);

			expect(result).toBe(0);
		});
	});

	describe('hasEnoughTokens', () => {
		it('should return true when balance is sufficient', async () => {
			const userToken = createMockUserToken({ tokenBalance: 100 });
			mockDb.where.mockResolvedValueOnce([userToken]);

			const result = await service.hasEnoughTokens(TEST_USER_ID, 50);

			expect(result).toBe(true);
		});

		it('should return false when balance is insufficient', async () => {
			const userToken = createMockUserToken({ tokenBalance: 10 });
			mockDb.where.mockResolvedValueOnce([userToken]);

			const result = await service.hasEnoughTokens(TEST_USER_ID, 50);

			expect(result).toBe(false);
		});
	});

	describe('getModelPrice', () => {
		it('should return model price when found', async () => {
			const price = createMockModelPrice({ modelName: 'gpt-4.1' });
			mockDb.where.mockResolvedValueOnce([price]);

			const result = await service.getModelPrice('gpt-4.1');

			expect(result).toEqual(price);
		});

		it('should return null when model not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getModelPrice('unknown-model');

			expect(result).toBeNull();
		});
	});

	describe('getModelPrices', () => {
		it('should return all model prices', async () => {
			const prices = [
				createMockModelPrice({ modelName: 'gpt-4.1' }),
				createMockModelPrice({ modelName: 'gemini-pro' }),
			];
			mockDb.from.mockResolvedValueOnce(prices);

			const result = await service.getModelPrices();

			expect(result).toEqual(prices);
		});
	});

	describe('calculateCost', () => {
		it('should calculate cost with model prices from DB', async () => {
			const price = createMockModelPrice({
				modelName: 'gpt-4.1',
				inputPricePer1kTokens: '0.010000',
				outputPricePer1kTokens: '0.030000',
				tokensPerDollar: 50000,
			});
			mockDb.where.mockResolvedValueOnce([price]);

			const result = await service.calculateCost('gpt-4.1', 1000, 500);

			expect(result.inputTokens).toBe(1000);
			expect(result.outputTokens).toBe(500);
			expect(result.totalTokens).toBe(1500);
			expect(result.costUsd).toBeCloseTo(0.025); // (1000/1000)*0.01 + (500/1000)*0.03
			expect(result.appTokens).toBeGreaterThan(0);
		});

		it('should use fallback prices when model not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.calculateCost('unknown-model', 1000, 500);

			expect(result.costUsd).toBeCloseTo(0.025); // fallback: same prices
			expect(result.appTokens).toBeGreaterThan(0);
		});

		it('should return minimum 1 app token', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.calculateCost('model', 1, 1);

			expect(result.appTokens).toBeGreaterThanOrEqual(1);
		});
	});

	describe('logUsage', () => {
		it('should deduct tokens and create transaction', async () => {
			// getBalance
			const userToken = createMockUserToken({ tokenBalance: 100 });
			mockDb.where.mockResolvedValueOnce([]); // getModelPrice → fallback
			mockDb.where.mockResolvedValueOnce([userToken]); // getBalance

			const result = await service.logUsage(TEST_USER_ID, 'gpt-4.1', 100, 200);

			expect(result.tokensUsed).toBeGreaterThan(0);
			expect(result.remainingBalance).toBeLessThan(100);
			expect(mockDb.update).toHaveBeenCalled(); // deduct tokens
			expect(mockDb.insert).toHaveBeenCalled(); // create transaction
		});

		it('should not go below 0 balance', async () => {
			mockDb.where.mockResolvedValueOnce([]); // getModelPrice
			const userToken = createMockUserToken({ tokenBalance: 1 });
			mockDb.where.mockResolvedValueOnce([userToken]); // getBalance

			const result = await service.logUsage(TEST_USER_ID, 'gpt-4.1', 10000, 10000);

			expect(result.remainingBalance).toBe(0);
		});
	});

	describe('getUsageStats', () => {
		it('should aggregate usage stats by model and date', async () => {
			const transactions = [
				createMockTokenTransaction({ amount: -10, modelUsed: 'gpt-4.1' }),
				createMockTokenTransaction({ amount: -5, modelUsed: 'gpt-4.1' }),
				createMockTokenTransaction({ amount: -3, modelUsed: 'gemini-pro' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(transactions);

			const result = await service.getUsageStats(TEST_USER_ID, 'month');

			expect(result.totalUsed).toBe(18);
			expect(result.byModel['gpt-4.1']).toBe(15);
			expect(result.byModel['gemini-pro']).toBe(3);
		});

		it('should return empty stats when no transactions', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.getUsageStats(TEST_USER_ID, 'week');

			expect(result.totalUsed).toBe(0);
			expect(result.byModel).toEqual({});
			expect(result.byDate).toEqual({});
		});
	});

	describe('getTransactions', () => {
		it('should return paginated transactions', async () => {
			const transactions = [createMockTokenTransaction(), createMockTokenTransaction()];
			mockDb.offset.mockResolvedValueOnce(transactions);

			const result = await service.getTransactions(TEST_USER_ID, 20, 0);

			expect(result).toEqual(transactions);
			expect(mockDb.limit).toHaveBeenCalled();
		});
	});
});
