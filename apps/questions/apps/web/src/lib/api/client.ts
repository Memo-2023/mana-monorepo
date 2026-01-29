/**
 * API Client for Questions backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:3011';

// Token storage for manual token management
let currentToken: string | null = null;

/**
 * Questions API client instance
 * - Supports manual token setting via setAccessToken()
 * - Runtime URL injection via window.__PUBLIC_BACKEND_URL__
 * - Consistent ApiResult<T> response format
 */
const api = createApiClient({
	baseUrl: BASE_URL,
	apiPrefix: '',
	getAuthToken: async () => currentToken,
	timeout: 30000,
	debug: import.meta.env.DEV,
});

/**
 * Legacy ApiClient class wrapper for backward compatibility
 * Maintains throw-based error handling for existing code
 */
class ApiClient {
	setAccessToken(token: string | null) {
		currentToken = token;
	}

	getAccessToken(): string | null {
		return currentToken;
	}

	async fetch<T>(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
		const { method = 'GET', body } = options;

		let result: ApiResult<T>;
		switch (method) {
			case 'POST':
				result = await api.post<T>(endpoint, body);
				break;
			case 'PUT':
				result = await api.put<T>(endpoint, body);
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

		if (result.data === null) {
			return {} as T;
		}

		return result.data;
	}

	get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'GET' });
	}

	post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'POST', body });
	}

	put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'PUT', body });
	}

	delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'DELETE' });
	}
}

export const apiClient = new ApiClient();
