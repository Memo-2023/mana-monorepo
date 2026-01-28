import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth store before importing client
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

vi.mock('$env/static/public', () => ({
	PUBLIC_BACKEND_URL: 'http://localhost:3023',
}));

describe('ApiClient', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockReset();
	});

	describe('get', () => {
		it('should make GET request with auth header', async () => {
			const mockResponse = { data: 'test' };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const { apiClient } = await import('./client');
			const result = await apiClient.get('/test');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3023/api/v1/test',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('should throw on non-ok response', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			const { apiClient } = await import('./client');

			await expect(apiClient.get('/notfound')).rejects.toThrow('API Error: 404');
		});
	});

	describe('post', () => {
		it('should make POST request with body', async () => {
			const mockResponse = { id: '123' };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const { apiClient } = await import('./client');
			const result = await apiClient.post('/meals', { name: 'Test' });

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3023/api/v1/meals',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ name: 'Test' }),
				})
			);
			expect(result).toEqual(mockResponse);
		});
	});

	describe('patch', () => {
		it('should make PATCH request', async () => {
			const mockResponse = { id: '123', name: 'Updated' };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const { apiClient } = await import('./client');
			const result = await apiClient.patch('/meals/123', { name: 'Updated' });

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3023/api/v1/meals/123',
				expect.objectContaining({
					method: 'PATCH',
				})
			);
			expect(result).toEqual(mockResponse);
		});
	});

	describe('delete', () => {
		it('should make DELETE request', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
			});

			const { apiClient } = await import('./client');
			await apiClient.delete('/meals/123');

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3023/api/v1/meals/123',
				expect.objectContaining({
					method: 'DELETE',
				})
			);
		});

		it('should throw on failed delete', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const { apiClient } = await import('./client');

			await expect(apiClient.delete('/meals/123')).rejects.toThrow('API Error: 500');
		});
	});
});
