/**
 * @manacore/shared-api-client
 *
 * Unified API client for all ManaCore web applications.
 * Provides consistent error handling, token management, and retry logic.
 *
 * @example
 * ```typescript
 * import { createApiClient } from '@manacore/shared-api-client';
 * import { authStore } from '$lib/stores/auth.svelte';
 *
 * // Create client instance
 * export const api = createApiClient({
 *   baseUrl: 'http://localhost:3014',
 *   apiPrefix: '/api/v1',
 *   getAuthToken: () => authStore.getValidToken(),
 *   timeout: 30000,
 *   retries: 2,
 * });
 *
 * // Make requests
 * const { data, error } = await api.get<User[]>('/users');
 *
 * if (error) {
 *   if (error.code === 'UNAUTHORIZED') {
 *     // Handle auth error
 *   }
 *   console.error('API Error:', error.message);
 *   return;
 * }
 *
 * // data is typed as User[]
 * console.log('Users:', data);
 * ```
 */

// Client factory
export { createApiClient } from './client';

// Types
export type {
	ApiClient,
	ApiClientConfig,
	ApiError,
	ApiErrorCode,
	ApiResult,
	RequestOptions,
} from './types';

// Utilities
export { buildQueryString, getBaseUrl } from './utils';
