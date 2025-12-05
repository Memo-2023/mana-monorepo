/**
 * Base API Client with Retry Logic
 *
 * Provides authenticated fetch with exponential backoff retry.
 */

import { authStore } from '$lib/stores/auth.svelte';

/**
 * Retry configuration
 */
export interface RetryConfig {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries: number;
	/** Initial delay in milliseconds (default: 1000) */
	retryDelay: number;
	/** Multiplier for exponential backoff (default: 2) */
	backoffMultiplier: number;
}

/**
 * API response wrapper
 */
export interface ApiResult<T> {
	data: T | null;
	error: string | null;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	retryDelay: 1000,
	backoffMultiplier: 2,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with authentication and retry logic
 *
 * @param url - Full URL to fetch
 * @param options - Fetch options (optional)
 * @param retryConfig - Retry configuration (optional)
 * @returns Promise with data or error
 */
export async function fetchWithRetry<T>(
	url: string,
	options: RequestInit = {},
	retryConfig: Partial<RetryConfig> = {}
): Promise<ApiResult<T>> {
	const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
	let lastError: string | null = null;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			// Get fresh token for each attempt
			const token = await authStore.getAccessToken();

			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					...options.headers,
				},
			});

			if (!response.ok) {
				// Don't retry on auth errors
				if (response.status === 401 || response.status === 403) {
					return {
						data: null,
						error: `Authentication failed (${response.status})`,
					};
				}

				// Don't retry on client errors (except rate limiting)
				if (response.status >= 400 && response.status < 500 && response.status !== 429) {
					const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
					return {
						data: null,
						error: errorBody.message || `HTTP ${response.status}`,
					};
				}

				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			return { data, error: null };
		} catch (e) {
			lastError = e instanceof Error ? e.message : 'Unknown error';

			// Don't retry on last attempt
			if (attempt < config.maxRetries) {
				const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
				console.warn(`API request failed, retrying in ${delay}ms...`, {
					url,
					attempt,
					error: lastError,
				});
				await sleep(delay);
			}
		}
	}

	return { data: null, error: lastError };
}

/**
 * Create an API client for a specific backend
 */
export function createApiClient(baseUrl: string) {
	return {
		get<T>(endpoint: string, retryConfig?: Partial<RetryConfig>): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(`${baseUrl}${endpoint}`, { method: 'GET' }, retryConfig);
		},

		post<T>(
			endpoint: string,
			body?: unknown,
			retryConfig?: Partial<RetryConfig>
		): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				`${baseUrl}${endpoint}`,
				{
					method: 'POST',
					body: body ? JSON.stringify(body) : undefined,
				},
				retryConfig
			);
		},

		put<T>(
			endpoint: string,
			body?: unknown,
			retryConfig?: Partial<RetryConfig>
		): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				`${baseUrl}${endpoint}`,
				{
					method: 'PUT',
					body: body ? JSON.stringify(body) : undefined,
				},
				retryConfig
			);
		},

		delete<T>(endpoint: string, retryConfig?: Partial<RetryConfig>): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(`${baseUrl}${endpoint}`, { method: 'DELETE' }, retryConfig);
		},
	};
}
