/**
 * API Client for NutriPhi backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:3023';

/**
 * NutriPhi API client instance
 * - Auto token handling via authStore.getAccessToken()
 * - Consistent ApiResult<T> response format
 */
const api = createApiClient({
	baseUrl: BASE_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getAccessToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

/**
 * Legacy ApiClient class wrapper for backward compatibility
 * Maintains throw-based error handling for existing code
 */
class ApiClient {
	async get<T>(path: string): Promise<T> {
		const result = await api.get<T>(path);
		if (result.error) {
			throw new Error(result.error.message);
		}
		return result.data as T;
	}

	async post<T>(path: string, data: unknown): Promise<T> {
		const result = await api.post<T>(path, data);
		if (result.error) {
			throw new Error(result.error.message);
		}
		return result.data as T;
	}

	async patch<T>(path: string, data: unknown): Promise<T> {
		const result = await api.patch<T>(path, data);
		if (result.error) {
			throw new Error(result.error.message);
		}
		return result.data as T;
	}

	async delete(path: string): Promise<void> {
		const result = await api.delete<void>(path);
		if (result.error) {
			throw new Error(result.error.message);
		}
	}
}

export const apiClient = new ApiClient();

// Re-export types for convenience
export type { ApiResult };
