/**
 * API Client for Calendar Backend
 */

import { env } from '$env/dynamic/public';
import { createApiClient, type FetchOptions, type ApiResult } from './base-client';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3014';

const calendarClient = createApiClient({
	baseUrl: API_BASE,
	apiPrefix: '/api/v1',
});

export async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<ApiResult<T>> {
	return calendarClient.fetchApi<T>(endpoint, options);
}

// Re-export types for backwards compatibility
export type { FetchOptions, ApiResult };
