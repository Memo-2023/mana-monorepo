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

import { contextService, type ContextSpace, type ContextDocument } from './context';

describe('contextService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getSpaces', () => {
		it('should fetch spaces', async () => {
			const spaces: ContextSpace[] = [
				{
					id: 's-1',
					userId: 'u-1',
					name: 'Research',
					pinned: true,
					prefix: 'R',
					createdAt: '2026-01-01',
					updatedAt: '2026-01-01',
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(spaces),
			});

			const result = await contextService.getSpaces();

			expect(result.data).toEqual(spaces);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/spaces'),
				expect.any(Object)
			);
		});
	});

	describe('getRecentDocuments', () => {
		it('should fetch recent documents with limit', async () => {
			const docs: ContextDocument[] = [
				{
					id: 'd-1',
					userId: 'u-1',
					spaceId: 's-1',
					title: 'Notes',
					type: 'text',
					shortId: 'RT1',
					pinned: false,
					createdAt: '2026-01-01',
					updatedAt: '2026-03-01',
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(docs),
			});

			const result = await contextService.getRecentDocuments(3);

			expect(result.data).toEqual(docs);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/documents/recent?limit=3'),
				expect.any(Object)
			);
		});
	});

	describe('getTokenBalance', () => {
		it('should fetch token balance', async () => {
			const balance = { tokenBalance: 5000, monthlyFreeTokens: 10000 };
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(balance),
			});

			const result = await contextService.getTokenBalance();

			expect(result.data).toEqual(balance);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/tokens/balance'),
				expect.any(Object)
			);
		});
	});

	describe('getCounts', () => {
		it('should return space count', async () => {
			const spaces = [
				{ id: 's-1', name: 'A' },
				{ id: 's-2', name: 'B' },
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(spaces),
			});

			const result = await contextService.getCounts();

			expect(result.data).toEqual({ spaces: 2, documents: 0 });
		});

		it('should return error on failure', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const result = await contextService.getCounts();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});
});
