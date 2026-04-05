import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

// Mock config
vi.mock('./config', () => ({
	getManaAuthUrl: vi.fn().mockReturnValue('http://localhost:3001'),
}));

import { creditsService } from './credits';

describe('creditsService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getBalance', () => {
		it('should fetch credit balance from correct endpoint', async () => {
			const mockBalance = { balance: 100, totalEarned: 500, totalSpent: 400 };
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockBalance),
			});

			const result = await creditsService.getBalance();

			expect(result).toEqual(mockBalance);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/credits/balance',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				})
			);
		});

		it('should throw on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				json: () => Promise.resolve({ message: 'Server error' }),
			});

			await expect(creditsService.getBalance()).rejects.toThrow('Server error');
		});
	});

	describe('getTransactions', () => {
		it('should fetch transactions with default pagination', async () => {
			const mockTransactions = [{ id: '1', type: 'purchase', amount: 100 }];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTransactions),
			});

			const result = await creditsService.getTransactions();

			expect(result).toEqual(mockTransactions);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/credits/transactions?limit=50&offset=0',
				expect.any(Object)
			);
		});

		it('should pass custom limit and offset', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([]),
			});

			await creditsService.getTransactions(10, 20);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/credits/transactions?limit=10&offset=20',
				expect.any(Object)
			);
		});
	});

	describe('getPackages', () => {
		it('should fetch packages without auth (public endpoint)', async () => {
			const mockPackages = [{ id: 'pkg-1', name: 'Starter', credits: 100 }];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockPackages),
			});

			const result = await creditsService.getPackages();

			expect(result).toEqual(mockPackages);
			// Should NOT have Authorization header (public endpoint)
			expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/credits/packages');
		});

		it('should throw on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

			await expect(creditsService.getPackages()).rejects.toThrow('Failed to fetch packages');
		});
	});

	describe('useCredits', () => {
		it('should send credit usage request', async () => {
			const mockResponse = { success: true, newBalance: { balance: 90 } };
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await creditsService.useCredits(10, 'chat', 'AI generation');

			expect(result).toEqual(mockResponse);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/credits/use',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ amount: 10, appId: 'chat', description: 'AI generation' }),
				})
			);
		});
	});
});
