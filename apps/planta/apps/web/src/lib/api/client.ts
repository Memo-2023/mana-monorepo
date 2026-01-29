/**
 * API Client for Planta backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const BASE_URL = 'http://localhost:3022';

/**
 * Planta API client instance
 * - Auto token handling via authStore.getValidToken()
 * - Runtime URL injection via window.__PUBLIC_BACKEND_URL__
 * - Consistent ApiResult<T> response format
 */
const api = createApiClient({
	baseUrl: BASE_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getValidToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

/**
 * Legacy fetchApi wrapper for backward compatibility
 * Returns { data, error } format
 */
export async function fetchApi<T>(
	endpoint: string,
	options: {
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: unknown;
		formData?: FormData;
	} = {}
): Promise<{ data: T | null; error: string | null }> {
	const token = await authStore.getValidToken();
	if (!token) {
		return { data: null, error: 'Not authenticated' };
	}

	let result: ApiResult<T>;

	if (options.formData) {
		result = await api.upload<T>(endpoint, options.formData);
	} else {
		switch (options.method) {
			case 'POST':
				result = await api.post<T>(endpoint, options.body);
				break;
			case 'PUT':
				result = await api.put<T>(endpoint, options.body);
				break;
			case 'DELETE':
				result = await api.delete<T>(endpoint);
				break;
			default:
				result = await api.get<T>(endpoint);
		}
	}

	if (result.error) {
		return { data: null, error: result.error.message };
	}
	return { data: result.data, error: null };
}
