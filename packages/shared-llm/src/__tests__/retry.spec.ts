import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryFetch } from '../utils/retry';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(status: number, body = ''): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: `Status ${status}`,
		text: () => Promise.resolve(body),
		json: () => Promise.resolve(JSON.parse(body || '{}')),
		headers: new Headers(),
	} as unknown as Response;
}

describe('retryFetch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns on first successful attempt', async () => {
		mockFetch.mockResolvedValueOnce(mockResponse(200, '{"ok": true}'));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('retries on 503 and succeeds', async () => {
		mockFetch
			.mockResolvedValueOnce(mockResponse(503))
			.mockResolvedValueOnce(mockResponse(200, '{}'));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('retries on 429 rate limit', async () => {
		mockFetch
			.mockResolvedValueOnce(mockResponse(429))
			.mockResolvedValueOnce(mockResponse(200, '{}'));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('retries on network error and succeeds', async () => {
		mockFetch
			.mockRejectedValueOnce(new Error('ECONNREFUSED'))
			.mockResolvedValueOnce(mockResponse(200, '{}'));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('does NOT retry on 400 client error', async () => {
		mockFetch.mockResolvedValueOnce(mockResponse(400, 'Bad Request'));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.status).toBe(400);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('does NOT retry on 401 unauthorized', async () => {
		mockFetch.mockResolvedValueOnce(mockResponse(401));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.status).toBe(401);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('does NOT retry on 404 not found', async () => {
		mockFetch.mockResolvedValueOnce(mockResponse(404));

		const response = await retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 });
		expect(response.status).toBe(404);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws after exhausting all retries', async () => {
		mockFetch
			.mockResolvedValueOnce(mockResponse(503))
			.mockResolvedValueOnce(mockResponse(503))
			.mockResolvedValueOnce(mockResponse(503));

		await expect(retryFetch('http://test', {}, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow(
			'HTTP 503'
		);

		expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
	});

	it('throws after exhausting retries on network errors', async () => {
		mockFetch
			.mockRejectedValueOnce(new Error('ECONNREFUSED'))
			.mockRejectedValueOnce(new Error('ECONNREFUSED'));

		await expect(retryFetch('http://test', {}, { maxRetries: 1, baseDelay: 10 })).rejects.toThrow(
			'ECONNREFUSED'
		);

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('works with maxRetries: 0 (no retries)', async () => {
		mockFetch.mockResolvedValueOnce(mockResponse(503));

		await expect(retryFetch('http://test', {}, { maxRetries: 0, baseDelay: 10 })).rejects.toThrow();

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});
