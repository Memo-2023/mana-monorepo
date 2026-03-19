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

import { mukkeService } from './mukke';

describe('mukkeService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('formatDuration', () => {
		it('should format 0 seconds', () => {
			expect(mukkeService.formatDuration(0)).toBe('0:00');
		});

		it('should format seconds only', () => {
			expect(mukkeService.formatDuration(45)).toBe('0:45');
		});

		it('should format minutes and seconds', () => {
			expect(mukkeService.formatDuration(185)).toBe('3:05');
		});

		it('should format hours', () => {
			expect(mukkeService.formatDuration(3661)).toBe('1:01:01');
		});

		it('should pad seconds with zero', () => {
			expect(mukkeService.formatDuration(60)).toBe('1:00');
		});

		it('should handle negative values', () => {
			expect(mukkeService.formatDuration(-10)).toBe('0:00');
		});
	});

	describe('getStats', () => {
		it('should fetch library stats', async () => {
			const mockStats = {
				totalSongs: 42,
				totalPlaylists: 5,
				totalProjects: 3,
				favoriteCount: 10,
				totalPlayTime: 7200,
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStats),
			});

			const result = await mukkeService.getStats();

			expect(result.data).toEqual(mockStats);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/library/stats'),
				expect.any(Object)
			);
		});
	});

	describe('getRecentSongs', () => {
		it('should fetch recent songs with default limit', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([{ id: 's-1', title: 'Song 1' }]),
			});

			const result = await mukkeService.getRecentSongs();

			expect(result.data).toHaveLength(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/songs?limit=5'),
				expect.any(Object)
			);
		});
	});
});
