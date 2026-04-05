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

import { apiKeysService, type ApiKey, type CreateApiKeyDto } from './api-keys';

describe('apiKeysService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('list', () => {
		it('should fetch API keys list', async () => {
			const mockKeys: ApiKey[] = [
				{
					id: 'key-1',
					name: 'Test Key',
					keyPrefix: 'mk_test_',
					scopes: ['read'],
					rateLimitRequests: 100,
					rateLimitWindow: 60,
					createdAt: '2026-01-01',
					lastUsedAt: null,
					revokedAt: null,
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockKeys),
			});

			const result = await apiKeysService.list();

			expect(result.data).toEqual(mockKeys);
			expect(result.error).toBeNull();
		});
	});

	describe('create', () => {
		it('should create a new API key', async () => {
			const mockResponse = {
				id: 'key-2',
				name: 'New Key',
				key: 'mk_full_secret_key',
				keyPrefix: 'mk_',
				scopes: ['read', 'write'],
				rateLimitRequests: 100,
				rateLimitWindow: 60,
				createdAt: '2026-03-19',
				lastUsedAt: null,
				revokedAt: null,
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const dto: CreateApiKeyDto = { name: 'New Key', scopes: ['read', 'write'] };
			const result = await apiKeysService.create(dto);

			expect(result.data).toEqual(mockResponse);
			expect(result.data?.key).toBe('mk_full_secret_key');
		});

		it('should send POST request with correct body', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
			});

			const dto: CreateApiKeyDto = { name: 'Test', scopes: ['read'] };
			await apiKeysService.create(dto);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/v1/api-keys'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(dto),
				})
			);
		});
	});

	describe('revoke', () => {
		it('should revoke an API key by ID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(undefined),
			});

			const result = await apiKeysService.revoke('key-1');

			expect(result.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/v1/api-keys/key-1'),
				expect.objectContaining({ method: 'DELETE' })
			);
		});
	});
});
