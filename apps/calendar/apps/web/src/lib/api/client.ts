/**
 * API Client for Calendar Backend
 * Uses @manacore/shared-api-client for consistent error handling
 *
 * Token handling: Uses authStore.getValidToken() which automatically
 * refreshes expired tokens before making requests.
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createApiClient, type ApiResult, type ApiClient } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

// Use client URL in browser (injected by hooks.server.ts), SSR URL on server
function getApiBase(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return env.PUBLIC_BACKEND_URL || 'http://localhost:3014';
}

/**
 * Calendar API client instance (lazy initialized)
 * - Auto token handling via authStore.getValidToken()
 * - Consistent ApiResult<T> response format
 */
let _api: ApiClient | null = null;

function getApi(): ApiClient {
	if (!_api) {
		_api = createApiClient({
			baseUrl: getApiBase(),
			apiPrefix: '/api/v1',
			getAuthToken: () => authStore.getValidToken(),
			timeout: 30000,
			debug: import.meta.env.DEV,
		});
	}
	return _api;
}

/**
 * Request deduplication for GET requests
 * Prevents identical concurrent requests from being sent multiple times
 */
const pendingRequests = new Map<string, Promise<ApiResult<unknown>>>();

/**
 * Legacy fetchApi interface for backwards compatibility
 */
export interface FetchOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
	isFormData?: boolean;
	timeout?: number;
}

/**
 * Fetch API wrapper using shared client
 * Maintains backward compatibility with existing code
 * GET requests are deduplicated — identical concurrent GETs share one in-flight request
 */
export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<ApiResult<T>> {
	const { method = 'GET', body, isFormData = false } = options;
	const api = getApi();

	if (isFormData && body instanceof FormData) {
		return api.upload<T>(endpoint, body);
	}

	// Deduplicate GET requests
	if (method === 'GET') {
		const existing = pendingRequests.get(endpoint);
		if (existing) {
			return existing as Promise<ApiResult<T>>;
		}
		const promise = api.get<T>(endpoint).finally(() => {
			pendingRequests.delete(endpoint);
		});
		pendingRequests.set(endpoint, promise as Promise<ApiResult<unknown>>);
		return promise;
	}

	switch (method) {
		case 'POST':
			return api.post<T>(endpoint, body);
		case 'PUT':
			return api.put<T>(endpoint, body);
		case 'PATCH':
			return api.patch<T>(endpoint, body);
		case 'DELETE':
			return api.delete<T>(endpoint);
		default:
			return api.get<T>(endpoint);
	}
}

// Re-export types for backwards compatibility
export type { ApiResult };
