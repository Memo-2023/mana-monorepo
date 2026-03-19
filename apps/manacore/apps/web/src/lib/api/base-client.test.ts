import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment before importing module
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('mock-token-123'),
	},
}));

import { fetchWithRetry, createApiClient, type RetryConfig, type ApiResult } from './base-client';

describe('fetchWithRetry', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return data on successful request', async () => {
		const mockData = { id: 1, name: 'test' };
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockData),
		});

		const result = await fetchWithRetry<typeof mockData>('https://api.example.com/data');

		expect(result.data).toEqual(mockData);
		expect(result.error).toBeNull();
	});

	it('should include Authorization header with token', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({}),
		});

		await fetchWithRetry('https://api.example.com/data');

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/data',
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token-123',
					'Content-Type': 'application/json',
				}),
			})
		);
	});

	it('should return error on 401 without retrying', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
		});

		const result = await fetchWithRetry('https://api.example.com/data');

		expect(result.data).toBeNull();
		expect(result.error).toContain('Authentication failed');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should return error on 403 without retrying', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
		});

		const result = await fetchWithRetry('https://api.example.com/data');

		expect(result.data).toBeNull();
		expect(result.error).toContain('Authentication failed');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should return error on 4xx client errors without retrying', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ message: 'Not found' }),
		});

		const result = await fetchWithRetry('https://api.example.com/data');

		expect(result.data).toBeNull();
		expect(result.error).toBe('Not found');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should return error on network failure without retrying', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

		const result = await fetchWithRetry('https://api.example.com/data');

		expect(result.data).toBeNull();
		expect(result.error).toBe('Service nicht erreichbar');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should return error on connection refused', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('ERR_CONNECTION_REFUSED'));

		const result = await fetchWithRetry('https://api.example.com/data');

		expect(result.data).toBeNull();
		expect(result.error).toBe('Service nicht erreichbar');
	});

	it('should retry on 5xx server errors', async () => {
		global.fetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 500 })
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

		const result = await fetchWithRetry('https://api.example.com/data', {}, { retryDelay: 1 });

		expect(result.data).toEqual({ success: true });
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it('should respect maxRetries config', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

		const result = await fetchWithRetry(
			'https://api.example.com/data',
			{},
			{ maxRetries: 1, retryDelay: 1 }
		);

		expect(result.data).toBeNull();
		expect(result.error).toContain('HTTP 500');
		// 1 initial + 1 retry = 2
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});
});

describe('createApiClient', () => {
	beforeEach(() => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ result: 'ok' }),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should create a client with get, post, put, delete methods', () => {
		const client = createApiClient('https://api.example.com');

		expect(typeof client.get).toBe('function');
		expect(typeof client.post).toBe('function');
		expect(typeof client.put).toBe('function');
		expect(typeof client.delete).toBe('function');
	});

	it('should prepend base URL to endpoints', async () => {
		const client = createApiClient('https://api.example.com');
		await client.get('/users');

		expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object));
	});

	it('should send GET requests correctly', async () => {
		const client = createApiClient('https://api.example.com');
		const result = await client.get('/data');

		expect(result.data).toEqual({ result: 'ok' });
		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/data',
			expect.objectContaining({ method: 'GET' })
		);
	});

	it('should send POST requests with body', async () => {
		const client = createApiClient('https://api.example.com');
		await client.post('/data', { name: 'test' });

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/data',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ name: 'test' }),
			})
		);
	});

	it('should send PUT requests with body', async () => {
		const client = createApiClient('https://api.example.com');
		await client.put('/data/1', { name: 'updated' });

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/data/1',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({ name: 'updated' }),
			})
		);
	});

	it('should send DELETE requests', async () => {
		const client = createApiClient('https://api.example.com');
		await client.delete('/data/1');

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/data/1',
			expect.objectContaining({ method: 'DELETE' })
		);
	});
});
