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

import { zitareService, type Favorite } from './zitare';

describe('zitareService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getFavorites', () => {
		it('should fetch favorites', async () => {
			const favorites: Favorite[] = [
				{ id: 'f-1', userId: 'u-1', quoteId: 'q-1', createdAt: '2026-01-01' },
				{ id: 'f-2', userId: 'u-1', quoteId: 'q-2', createdAt: '2026-02-01' },
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(favorites),
			});

			const result = await zitareService.getFavorites();

			expect(result.data).toEqual(favorites);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/favorites'),
				expect.any(Object)
			);
		});
	});

	describe('getRandomFavorite', () => {
		it('should return a random favorite from the list', async () => {
			const favorites: Favorite[] = [
				{ id: 'f-1', userId: 'u-1', quoteId: 'q-1', createdAt: '2026-01-01' },
				{ id: 'f-2', userId: 'u-1', quoteId: 'q-2', createdAt: '2026-02-01' },
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(favorites),
			});

			const result = await zitareService.getRandomFavorite();

			expect(result.data).toBeTruthy();
			expect(result.error).toBeNull();
			expect(favorites.map((f) => f.id)).toContain(result.data!.id);
		});

		it('should return error when no favorites exist', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([]),
			});

			const result = await zitareService.getRandomFavorite();

			expect(result.data).toBeNull();
			expect(result.error).toBe('No favorites found');
		});
	});

	describe('getFavoriteCount', () => {
		it('should return the count of favorites', async () => {
			const favorites = [
				{ id: 'f-1', userId: 'u-1', quoteId: 'q-1', createdAt: '2026-01-01' },
				{ id: 'f-2', userId: 'u-1', quoteId: 'q-2', createdAt: '2026-02-01' },
				{ id: 'f-3', userId: 'u-1', quoteId: 'q-3', createdAt: '2026-03-01' },
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(favorites),
			});

			const result = await zitareService.getFavoriteCount();

			expect(result.data).toBe(3);
			expect(result.error).toBeNull();
		});

		it('should return error on network failure', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const result = await zitareService.getFavoriteCount();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});

	describe('getLists', () => {
		it('should fetch quote lists', async () => {
			const lists = [
				{
					id: 'l-1',
					userId: 'u-1',
					name: 'Motivation',
					quoteIds: ['q-1', 'q-2'],
					createdAt: '2026-01-01',
					updatedAt: '2026-01-01',
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(lists),
			});

			const result = await zitareService.getLists();

			expect(result.data).toEqual(lists);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/lists'),
				expect.any(Object)
			);
		});
	});
});
