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

import { presiService, type PresiDeck } from './presi';

const mockDeck = (overrides: Partial<PresiDeck> = {}): PresiDeck => ({
	id: 'd-1',
	userId: 'u-1',
	title: 'Test Deck',
	isPublic: false,
	createdAt: '2026-01-01',
	updatedAt: '2026-03-01',
	...overrides,
});

describe('presiService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getDecks', () => {
		it('should fetch decks', async () => {
			const decks = [mockDeck()];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(decks),
			});

			const result = await presiService.getDecks();

			expect(result.data).toEqual(decks);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/decks'),
				expect.any(Object)
			);
		});
	});

	describe('getRecentDecks', () => {
		it('should sort by updatedAt and limit', async () => {
			const decks = [
				mockDeck({ id: 'd-1', updatedAt: '2026-01-01' }),
				mockDeck({ id: 'd-2', updatedAt: '2026-03-01' }),
				mockDeck({ id: 'd-3', updatedAt: '2026-02-01' }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(decks),
			});

			const result = await presiService.getRecentDecks(2);

			expect(result.data).toHaveLength(2);
			expect(result.data![0].id).toBe('d-2');
			expect(result.data![1].id).toBe('d-3');
		});
	});

	describe('getDeckCount', () => {
		it('should count total and public decks', async () => {
			const decks = [
				mockDeck({ isPublic: true }),
				mockDeck({ id: 'd-2', isPublic: false }),
				mockDeck({ id: 'd-3', isPublic: true }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(decks),
			});

			const result = await presiService.getDeckCount();

			expect(result.data).toEqual({ total: 3, public: 2 });
		});

		it('should return error on failure', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const result = await presiService.getDeckCount();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});
});
