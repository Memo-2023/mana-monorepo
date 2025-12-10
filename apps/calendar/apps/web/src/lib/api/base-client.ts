/**
 * Base API Client Factory
 * Eliminates duplication between calendar and todo API clients
 */

import { browser } from '$app/environment';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetchOptions {
	method?: HttpMethod;
	body?: unknown;
	token?: string;
	isFormData?: boolean;
	timeout?: number;
}

export interface ApiResult<T> {
	data: T | null;
	error: Error | null;
}

export interface ApiClientConfig {
	baseUrl: string;
	apiPrefix?: string;
	getAuthToken?: () => string | null;
	defaultTimeout?: number;
}

/**
 * Creates a configured API client for a specific backend
 */
export function createApiClient(config: ApiClientConfig) {
	const { baseUrl, apiPrefix = '/api/v1', defaultTimeout = 30000 } = config;

	async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
		const { method = 'GET', body, token, isFormData = false, timeout = defaultTimeout } = options;

		// Get auth token
		let authToken = token;
		if (!authToken && browser) {
			authToken = config.getAuthToken?.() ?? localStorage.getItem('@auth/appToken') ?? undefined;
		}

		// Setup abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const headers: Record<string, string> = {};

			// Don't set Content-Type for FormData - browser sets it automatically with boundary
			if (!isFormData) {
				headers['Content-Type'] = 'application/json';
			}

			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${baseUrl}${apiPrefix}${endpoint}`, {
				method,
				headers,
				body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: new Error(errorData.message || `API error: ${response.status}`),
				};
			}

			// Handle empty responses (204 No Content)
			if (response.status === 204) {
				return { data: null, error: null };
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === 'AbortError') {
				return {
					data: null,
					error: new Error('Request timed out'),
				};
			}

			return {
				data: null,
				error: error instanceof Error ? error : new Error('Unknown error'),
			};
		}
	}

	return { fetchApi };
}

/**
 * Helper to build query strings from object
 */
export function buildQueryString(params: Record<string, unknown>): string {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			searchParams.append(key, String(value));
		}
	});
	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
}
