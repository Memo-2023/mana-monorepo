import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DuplicateGroup, MergeResult } from './duplicates';

vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('mock-token'),
	},
}));

vi.mock('./config', () => ({
	API_BASE: 'http://localhost:3015/api/v1',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocks are set up
const { duplicatesApi } = await import('./duplicates');

describe('duplicatesApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findDuplicates', () => {
		it('should call GET /duplicates and return duplicates', async () => {
			const mockResponse: { duplicates: DuplicateGroup[]; total: number } = {
				duplicates: [
					{
						id: 'group-1',
						contacts: [
							{ id: 'c1', firstName: 'John', email: 'john@example.com' } as any,
							{ id: 'c2', firstName: 'John', email: 'john@example.com' } as any,
						],
						matchType: 'email',
						matchValue: 'john@example.com',
					},
				],
				total: 1,
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue(mockResponse),
			});

			const result = await duplicatesApi.findDuplicates();

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:3015/api/v1/duplicates', {
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer mock-token',
				},
			});
			expect(result).toEqual(mockResponse);
		});

		it('should throw an error when the request fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
			});

			await expect(duplicatesApi.findDuplicates()).rejects.toThrow('Unauthorized');
		});
	});

	describe('mergeContacts', () => {
		it('should call POST /duplicates/merge with correct body', async () => {
			const mockResult: MergeResult = {
				mergedContact: {
					id: 'c1',
					firstName: 'John',
					email: 'john@example.com',
				} as any,
				deletedIds: ['c2', 'c3'],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue(mockResult),
			});

			const result = await duplicatesApi.mergeContacts('c1', ['c2', 'c3']);

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:3015/api/v1/duplicates/merge', {
				method: 'POST',
				body: JSON.stringify({ primaryId: 'c1', mergeIds: ['c2', 'c3'] }),
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer mock-token',
				},
			});
			expect(result).toEqual(mockResult);
		});

		it('should throw an error when merge fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				json: vi.fn().mockResolvedValue({ message: 'Merge conflict' }),
			});

			await expect(duplicatesApi.mergeContacts('c1', ['c2'])).rejects.toThrow('Merge conflict');
		});
	});

	describe('dismissDuplicate', () => {
		it('should call DELETE /duplicates/:groupId/dismiss', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue(undefined),
			});

			await duplicatesApi.dismissDuplicate('group-1');

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:3015/api/v1/duplicates/group-1/dismiss',
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer mock-token',
					},
				}
			);
		});

		it('should throw an error when dismiss fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				json: vi.fn().mockResolvedValue({ message: 'Group not found' }),
			});

			await expect(duplicatesApi.dismissDuplicate('nonexistent')).rejects.toThrow(
				'Group not found'
			);
		});
	});
});
