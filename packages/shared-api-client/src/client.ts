/**
 * API Client Factory
 * Creates a configured API client with consistent error handling
 */

import type { ApiClient, ApiClientConfig, ApiResult, RequestOptions } from './types';
import {
	buildQueryString,
	createApiError,
	getBaseUrl,
	getErrorCodeFromStatus,
	isRetryableError,
	parseErrorResponse,
} from './utils';
import { sleep } from '@mana/shared-utils';

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Create a configured API client instance
 *
 * @example
 * ```typescript
 * import { createApiClient } from '@mana/shared-api-client';
 * import { authStore } from '$lib/stores/auth.svelte';
 *
 * export const api = createApiClient({
 *   baseUrl: 'http://localhost:3014',
 *   apiPrefix: '/api/v1',
 *   getAuthToken: () => authStore.getValidToken(),
 * });
 *
 * // Usage
 * const { data, error } = await api.get<User[]>('/users');
 * if (error) {
 *   console.error('Failed:', error.message);
 *   return;
 * }
 * // data is typed as User[]
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
	const {
		apiPrefix = '',
		getAuthToken,
		timeout = DEFAULT_TIMEOUT,
		retries = DEFAULT_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		onError,
		debug = false,
	} = config;

	/**
	 * Internal fetch with error handling, timeout, and retries
	 */
	async function fetchWithRetry<T>(
		endpoint: string,
		init: RequestInit,
		options: RequestOptions = {},
		attemptNum = 0
	): Promise<ApiResult<T>> {
		const baseUrl = config.useRuntimeUrl !== false ? getBaseUrl(config.baseUrl) : config.baseUrl;
		const queryString = options.params ? buildQueryString(options.params) : '';
		const url = baseUrl + apiPrefix + endpoint + queryString;
		const requestTimeout = options.timeout ?? timeout;
		const maxRetries = options.retries ?? retries;

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

		try {
			// Get auth token if not skipping
			const headers: Record<string, string> = {
				...((init.headers as Record<string, string>) || {}),
				...(options.headers || {}),
			};

			if (!options.skipAuth && getAuthToken) {
				const token = await getAuthToken();
				if (token) {
					headers['Authorization'] = 'Bearer ' + token;
				}
			}

			if (debug) {
				console.log('[API] ' + init.method + ' ' + url);
			}

			const response = await fetch(url, {
				...init,
				headers,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			// Handle 204 No Content
			if (response.status === 204) {
				return { data: null as T, error: null };
			}

			// Handle error responses
			if (!response.ok) {
				const errorMessage = await parseErrorResponse(response);
				const error = createApiError(
					errorMessage,
					getErrorCodeFromStatus(response.status),
					response.status
				);

				// Retry on server errors
				if (isRetryableError(error) && attemptNum < maxRetries) {
					if (debug) {
						console.log('[API] Retry ' + (attemptNum + 1) + '/' + maxRetries + ' for ' + url);
					}
					await sleep(retryDelay * (attemptNum + 1)); // Exponential backoff
					return fetchWithRetry<T>(endpoint, init, options, attemptNum + 1);
				}

				if (onError) {
					onError(error, endpoint);
				}

				return { data: null, error };
			}

			// Parse JSON response
			const contentType = response.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				const data = await response.json();
				return { data, error: null };
			}

			// Handle non-JSON responses (e.g., text, blob)
			const text = await response.text();
			return { data: text as T, error: null };
		} catch (err) {
			clearTimeout(timeoutId);

			// Handle abort (timeout)
			if (err instanceof DOMException && err.name === 'AbortError') {
				const error = createApiError('Request timed out after ' + requestTimeout + 'ms', 'TIMEOUT');

				if (attemptNum < maxRetries) {
					if (debug) {
						console.log(
							'[API] Retry ' + (attemptNum + 1) + '/' + maxRetries + ' after timeout for ' + url
						);
					}
					await sleep(retryDelay * (attemptNum + 1));
					return fetchWithRetry<T>(endpoint, init, options, attemptNum + 1);
				}

				if (onError) {
					onError(error, endpoint);
				}
				return { data: null, error };
			}

			// Handle network errors
			const error = createApiError(
				err instanceof Error ? err.message : 'Network error',
				'NETWORK_ERROR'
			);

			if (attemptNum < maxRetries) {
				if (debug) {
					console.log(
						'[API] Retry ' + (attemptNum + 1) + '/' + maxRetries + ' after network error for ' + url
					);
				}
				await sleep(retryDelay * (attemptNum + 1));
				return fetchWithRetry<T>(endpoint, init, options, attemptNum + 1);
			}

			if (onError) {
				onError(error, endpoint);
			}
			return { data: null, error };
		}
	}

	/**
	 * Prepare request body and headers
	 */
	function prepareBody(body: unknown): { body?: string; contentType?: string } {
		if (body === undefined || body === null) {
			return {};
		}

		if (body instanceof FormData) {
			// Don't set Content-Type for FormData - browser handles it
			return {};
		}

		return {
			body: JSON.stringify(body),
			contentType: 'application/json',
		};
	}

	return {
		async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'GET',
					headers: { Accept: 'application/json' },
				},
				options
			);
		},

		async post<T>(
			endpoint: string,
			body?: unknown,
			options?: RequestOptions
		): Promise<ApiResult<T>> {
			const { body: jsonBody, contentType } = prepareBody(body);
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'POST',
					headers: {
						Accept: 'application/json',
						...(contentType ? { 'Content-Type': contentType } : {}),
					},
					body: jsonBody,
				},
				options
			);
		},

		async put<T>(
			endpoint: string,
			body?: unknown,
			options?: RequestOptions
		): Promise<ApiResult<T>> {
			const { body: jsonBody, contentType } = prepareBody(body);
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'PUT',
					headers: {
						Accept: 'application/json',
						...(contentType ? { 'Content-Type': contentType } : {}),
					},
					body: jsonBody,
				},
				options
			);
		},

		async patch<T>(
			endpoint: string,
			body?: unknown,
			options?: RequestOptions
		): Promise<ApiResult<T>> {
			const { body: jsonBody, contentType } = prepareBody(body);
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'PATCH',
					headers: {
						Accept: 'application/json',
						...(contentType ? { 'Content-Type': contentType } : {}),
					},
					body: jsonBody,
				},
				options
			);
		},

		async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'DELETE',
					headers: { Accept: 'application/json' },
				},
				options
			);
		},

		async upload<T>(
			endpoint: string,
			formData: FormData,
			options?: RequestOptions
		): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				endpoint,
				{
					method: 'POST',
					// Don't set Content-Type - browser handles multipart boundary
					headers: { Accept: 'application/json' },
					body: formData,
				},
				options
			);
		},
	};
}
