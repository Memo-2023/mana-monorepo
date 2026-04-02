/**
 * API Client for Clock backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const API_URL = 'http://localhost:3017';

/**
 * Clock API client instance
 * - Auto token handling via authStore.getValidToken()
 * - Consistent ApiResult<T> response format
 * - Automatic retry on server errors (configurable)
 */
export const api = createApiClient({
	baseUrl: API_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getValidToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

// Re-export types for convenience
export type { ApiResult };
