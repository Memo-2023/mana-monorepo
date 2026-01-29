/**
 * API Client for Todo backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const API_URL = PUBLIC_BACKEND_URL || 'http://localhost:3018';

// Token storage for manual token management (legacy pattern)
let currentToken: string | null = null;

/**
 * Todo API client instance
 * - Supports manual token setting via setAccessToken()
 * - Consistent ApiResult<T> response format
 * - Runtime URL injection for Docker
 */
export const api = createApiClient({
	baseUrl: API_URL,
	apiPrefix: '',
	getAuthToken: async () => currentToken,
	timeout: 30000,
	debug: import.meta.env.DEV,
});

/**
 * Legacy token management functions
 * Used by auth store to set token after login
 */
export function setAccessToken(token: string | null) {
	currentToken = token;
}

export function getAccessToken(): string | null {
	return currentToken;
}

/**
 * Wrapper for legacy code that expects throws instead of ApiResult
 * Converts ApiResult to throw-based pattern for backward compatibility
 */
export async function fetchApi<T>(
	endpoint: string,
	options: { method?: string; body?: unknown } = {}
): Promise<T> {
	const { method = 'GET', body } = options;

	let result: ApiResult<T>;
	switch (method) {
		case 'POST':
			result = await api.post<T>(endpoint, body);
			break;
		case 'PUT':
			result = await api.put<T>(endpoint, body);
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

	if (result.error) {
		throw new Error(result.error.message);
	}

	return result.data as T;
}

/**
 * Legacy apiClient wrapper for backward compatibility
 */
export const apiClient = {
	setAccessToken,
	getAccessToken,
	get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
	post: <T>(endpoint: string, body?: unknown) => fetchApi<T>(endpoint, { method: 'POST', body }),
	put: <T>(endpoint: string, body?: unknown) => fetchApi<T>(endpoint, { method: 'PUT', body }),
	patch: <T>(endpoint: string, body?: unknown) => fetchApi<T>(endpoint, { method: 'PATCH', body }),
	delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};

// Re-export types for convenience
export type { ApiResult };
