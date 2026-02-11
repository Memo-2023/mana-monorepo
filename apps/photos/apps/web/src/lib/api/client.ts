/**
 * API Client for Photos backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const API_URL = PUBLIC_BACKEND_URL || 'http://localhost:3019';

/**
 * Photos API client instance
 */
export const api = createApiClient({
	baseUrl: API_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getValidToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

/**
 * Legacy fetchWithAuth wrapper for backward compatibility
 */
export async function fetchWithAuth<T = unknown>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	const method = options.method || 'GET';
	const body = options.body ? JSON.parse(options.body as string) : undefined;

	let result: ApiResult<T>;
	switch (method) {
		case 'POST':
			result = await api.post<T>(url, body);
			break;
		case 'PUT':
			result = await api.put<T>(url, body);
			break;
		case 'PATCH':
			result = await api.patch<T>(url, body);
			break;
		case 'DELETE':
			result = await api.delete<T>(url);
			break;
		default:
			result = await api.get<T>(url);
	}

	if (result.error) {
		throw new Error(result.error.message);
	}

	return result.data as T;
}

/**
 * Upload file with auth
 */
export async function uploadWithAuth<T = unknown>(url: string, formData: FormData): Promise<T> {
	const result = await api.upload<T>(url, formData);

	if (result.error) {
		throw new Error(result.error.message);
	}

	return result.data as T;
}

export type { ApiResult };
