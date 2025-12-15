/**
 * API Client for Clock backend
 * Uses runtime configuration for 12-factor compliance
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getApiBaseUrl } from '$lib/config/runtime';

export interface ApiResponse<T> {
	data?: T;
	error?: string;
}

export async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<ApiResponse<T>> {
	try {
		const token = await authStore.getAccessToken();
		const apiBaseUrl = await getApiBaseUrl();

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};

		if (token) {
			(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${apiBaseUrl}/api/v1${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error: errorData.message || `HTTP error ${response.status}`,
			};
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return { data: undefined as T };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error('API Error:', error);
		return {
			error: error instanceof Error ? error.message : 'Network error',
		};
	}
}

// Convenience methods
export const api = {
	get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),

	post: <T>(endpoint: string, body?: unknown) =>
		fetchApi<T>(endpoint, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
		}),

	put: <T>(endpoint: string, body?: unknown) =>
		fetchApi<T>(endpoint, {
			method: 'PUT',
			body: body ? JSON.stringify(body) : undefined,
		}),

	patch: <T>(endpoint: string, body?: unknown) =>
		fetchApi<T>(endpoint, {
			method: 'PATCH',
			body: body ? JSON.stringify(body) : undefined,
		}),

	delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
