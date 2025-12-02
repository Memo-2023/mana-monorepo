/**
 * API Client for Calendar Backend
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

type FetchOptions = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
	isFormData?: boolean;
};

export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body, token, isFormData = false } = options;

	let authToken = token;
	if (!authToken && browser) {
		authToken = localStorage.getItem('@auth/appToken') || undefined;
	}

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
