/**
 * API Client for Calendar Backend
 * Uses @manacore/shared-api-client for consistent error handling
 *
 * Token handling: Uses authStore.getValidToken() which automatically
 * refreshes expired tokens before making requests.
 */

import { env } from '$env/dynamic/public';
import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

/**
 * Calendar API client instance
 * - Auto token handling via authStore.getValidToken()
 * - Consistent ApiResult<T> response format
 */
const api = createApiClient({
	baseUrl: API_BASE,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getValidToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

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
 */
export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<ApiResult<T>> {
	const { method = 'GET', body, isFormData = false } = options;

	if (isFormData && body instanceof FormData) {
		return api.upload<T>(endpoint, body);
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
