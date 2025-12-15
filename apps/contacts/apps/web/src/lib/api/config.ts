/**
 * API Configuration
 * Uses runtime configuration for 12-factor compliance
 */

import { getBackendUrl, getAuthUrl } from '$lib/config/runtime';

/**
 * Get API base URL with /api/v1 suffix
 */
export async function getApiBase(): Promise<string> {
	const backendUrl = await getBackendUrl();
	return `${backendUrl}/api/v1`;
}

/**
 * Get Mana Core Auth URL
 */
export async function getManaAuthUrl(): Promise<string> {
	return await getAuthUrl();
}

/**
 * @deprecated Use getApiBase() instead for runtime config
 * This export is kept for backward compatibility
 */
export const API_BASE = 'http://localhost:3015/api/v1';

/**
 * @deprecated Use getManaAuthUrl() instead for runtime config
 * This export is kept for backward compatibility
 */
export const MANA_AUTH_URL = 'http://localhost:3001';
