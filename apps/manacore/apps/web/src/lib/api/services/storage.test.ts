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

import { storageService, type StorageStats } from './storage';

describe('storageService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('formatSize', () => {
		it('should format 0 bytes', () => {
			expect(storageService.formatSize(0)).toBe('0 B');
		});

		it('should format bytes', () => {
			expect(storageService.formatSize(500)).toBe('500 B');
		});

		it('should format kilobytes', () => {
			expect(storageService.formatSize(1024)).toBe('1 KB');
			expect(storageService.formatSize(1536)).toBe('1.5 KB');
		});

		it('should format megabytes', () => {
			expect(storageService.formatSize(1048576)).toBe('1 MB');
			expect(storageService.formatSize(5242880)).toBe('5 MB');
		});

		it('should format gigabytes', () => {
			expect(storageService.formatSize(1073741824)).toBe('1 GB');
		});

		it('should format terabytes', () => {
			expect(storageService.formatSize(1099511627776)).toBe('1 TB');
		});

		it('should format with decimal precision', () => {
			expect(storageService.formatSize(1500000)).toBe('1.43 MB');
		});
	});

	describe('getStats', () => {
		it('should fetch storage statistics', async () => {
			const mockStats: StorageStats = {
				totalFiles: 42,
				totalSize: 104857600,
				favoriteCount: 5,
				recentFiles: [],
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStats),
			});

			const result = await storageService.getStats();

			expect(result.data).toEqual(mockStats);
			expect(result.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/files/stats'),
				expect.any(Object)
			);
		});

		it('should return error on failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
			});

			const result = await storageService.getStats();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});

	describe('getRecentFiles', () => {
		it('should return limited recent files from stats', async () => {
			const files = Array.from({ length: 10 }, (_, i) => ({
				id: `f-${i}`,
				name: `file-${i}.txt`,
				originalName: `file-${i}.txt`,
				mimeType: 'text/plain',
				size: 1024,
				storagePath: `/files/f-${i}`,
				storageKey: `f-${i}`,
				isFavorite: false,
				currentVersion: 1,
				createdAt: '2026-01-01',
				updatedAt: '2026-01-01',
			}));
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						totalFiles: 10,
						totalSize: 10240,
						favoriteCount: 0,
						recentFiles: files,
					}),
			});

			const result = await storageService.getRecentFiles(3);

			expect(result.data).toHaveLength(3);
		});
	});
});
