/**
 * API Client for Picture Backend
 * Uses @manacore/shared-api-client for consistent error handling
 *
 * Token handling:
 * - Uses authStore.getValidToken() which automatically refreshes expired tokens
 * - Consistent ApiResult<T> response format
 */

import { env } from '$env/dynamic/public';
import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Picture API client instance
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

type FetchOptions = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
	isFormData?: boolean;
};

/**
 * Legacy fetchApi wrapper for backward compatibility
 * Returns { data, error } format where error is Error | null
 */
export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body, isFormData = false } = options;

	let result: ApiResult<T>;

	if (isFormData && body instanceof FormData) {
		result = await api.upload<T>(endpoint, body);
	} else {
		switch (method) {
			case 'POST':
				result = await api.post<T>(endpoint, body);
				break;
			case 'PATCH':
				result = await api.patch<T>(endpoint, body);
				break;
			case 'DELETE':
				result = await api.delete<T>(endpoint);
				break;
			default:
				result = await api.get<T>(endpoint);
		}
	}

	// Convert ApiResult to legacy format
	if (result.error) {
		return {
			data: null,
			error: new Error(result.error.message),
		};
	}
	return { data: result.data, error: null };
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(
	endpoint: string,
	file: File,
	token?: string
): Promise<{ data: any; error: Error | null }> {
	const formData = new FormData();
	formData.append('file', file);

	const result = await api.upload<any>(endpoint, formData);

	if (result.error) {
		return {
			data: null,
			error: new Error(result.error.message),
		};
	}
	return { data: result.data, error: null };
}

/**
 * Upload multiple files to the backend
 */
export async function uploadFiles(
	endpoint: string,
	files: File[],
	token?: string
): Promise<{ data: any; error: Error | null }> {
	const formData = new FormData();
	files.forEach((file) => {
		formData.append('files', file);
	});

	const result = await api.upload<any>(endpoint, formData);

	if (result.error) {
		return {
			data: null,
			error: new Error(result.error.message),
		};
	}
	return { data: result.data, error: null };
}
