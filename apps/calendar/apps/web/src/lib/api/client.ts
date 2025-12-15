/**
 * API Client for Calendar Backend
 *
 * Uses runtime configuration (12-factor pattern) instead of build-time env vars.
 * Token handling: Uses authStore.getValidToken() which automatically
 * refreshes expired tokens before making requests.
 */

import { getBackendUrl } from '$lib/config/runtime';
import { createApiClient, type FetchOptions, type ApiResult } from './base-client';

let calendarClient: ReturnType<typeof createApiClient> | null = null;

async function getClient() {
	if (!calendarClient) {
		const backendUrl = await getBackendUrl();
		calendarClient = createApiClient({
			baseUrl: backendUrl,
			apiPrefix: '/api/v1',
		});
	}
	return calendarClient;
}

export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<ApiResult<T>> {
	const client = await getClient();
	return client.fetchApi<T>(endpoint, options);
}

// Re-export types for backwards compatibility
export type { FetchOptions, ApiResult };
