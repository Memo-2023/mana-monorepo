/**
 * Centralized API client with authentication
 */

import { authStore } from '$lib/stores/auth.svelte';
import { API_BASE } from './config';

/**
 * Make an authenticated API request
 * @param url API endpoint (will be prefixed with API_BASE)
 * @param options Fetch options
 * @returns Parsed JSON response
 */
export async function fetchWithAuth<T = unknown>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	const token = await authStore.getAccessToken();

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || 'Request failed');
	}

	return response.json();
}

/**
 * Make an authenticated API request without JSON content type
 * Used for file uploads (FormData)
 */
export async function fetchWithAuthFormData<T = unknown>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	const token = await authStore.getAccessToken();

	const headers: HeadersInit = {
		...(options.headers || {}),
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || 'Request failed');
	}

	return response.json();
}
