/**
 * API Client for Context backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const API_URL =
	import.meta.env.VITE_BACKEND_URL || import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3020';

export const api = createApiClient({
	baseUrl: API_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getValidToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

export type { ApiResult };
