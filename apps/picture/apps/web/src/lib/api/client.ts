/**
 * API Client for Picture Backend
 * Replaces direct Supabase calls with backend API calls.
 *
 * Token handling:
 * - Uses authStore.getValidToken() which automatically refreshes expired tokens
 * - The fetch interceptor (setupFetchInterceptor) handles 401 responses by refreshing and retrying
 * - If refresh fails, the request fails and user should be redirected to login
 */

import { env } from '$env/dynamic/public';
import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3006';

type FetchOptions = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
	isFormData?: boolean;
};

export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body, token, isFormData = false } = options;

	// Get a valid token (auto-refreshes if expired)
	const authToken = token || (await authStore.getValidToken());

	try {
		const headers: Record<string, string> = {};

		// Don't set Content-Type for FormData - browser sets it automatically with boundary
		if (!isFormData) {
			headers['Content-Type'] = 'application/json';
		}

		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}

		const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
			method,
			headers,
			body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
		});

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
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Unknown error'),
		};
	}
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(
	endpoint: string,
	file: File,
	token?: string
): Promise<{ data: any; error: Error | null }> {
	// Get a valid token (auto-refreshes if expired)
	const authToken = token || (await authStore.getValidToken());

	try {
		const formData = new FormData();
		formData.append('file', file);

		const headers: Record<string, string> = {};
		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}

		const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
			method: 'POST',
			headers,
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: new Error(errorData.message || `Upload error: ${response.status}`),
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Upload failed'),
		};
	}
}

/**
 * Upload multiple files to the backend
 */
export async function uploadFiles(
	endpoint: string,
	files: File[],
	token?: string
): Promise<{ data: any; error: Error | null }> {
	// Get a valid token (auto-refreshes if expired)
	const authToken = token || (await authStore.getValidToken());

	try {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append('files', file);
		});

		const headers: Record<string, string> = {};
		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}

		const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
			method: 'POST',
			headers,
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: new Error(errorData.message || `Upload error: ${response.status}`),
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Upload failed'),
		};
	}
}
