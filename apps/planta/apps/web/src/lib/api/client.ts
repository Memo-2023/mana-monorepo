/**
 * API Client for Planta backend
 */

import { browser } from '$app/environment';
import { authStore } from '$lib/stores/auth.svelte';

function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		return injectedUrl || 'http://localhost:3022';
	}
	return 'http://localhost:3022';
}

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

	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};

	// Don't set Content-Type for FormData - browser will set it with boundary
	if (!options.formData) {
		headers['Content-Type'] = 'application/json';
	}

	try {
		const response = await fetch(`${getBackendUrl()}/api/v1${endpoint}`, {
			method: options.method || 'GET',
			headers,
			body: options.formData || (options.body ? JSON.stringify(options.body) : undefined),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: errorData.message || `API error: ${response.status}`,
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
