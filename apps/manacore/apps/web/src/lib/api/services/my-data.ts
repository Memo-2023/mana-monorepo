/**
 * My Data API Service
 *
 * Self-service GDPR endpoints for users to view, export, and delete their own data.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';
import { authStore } from '$lib/stores/auth.svelte';

// Re-export types from admin (same structure for user data)
export type {
	UserDataSummary,
	DeleteUserDataResponse,
	ProjectDataSummary,
	EntityCount,
	UserInfo,
	AuthDataSummary,
	CreditsDataSummary,
} from './admin';

/**
 * User data export with metadata
 */
export interface UserDataExport {
	exportedAt: string;
	exportVersion: string;
	data: import('./admin').UserDataSummary;
}

// Get Auth API URL dynamically at runtime
function getAuthApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	return 'http://localhost:3001/api/v1';
}

// Lazy-initialized client
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getAuthApiUrl());
	}
	return _client;
}

/**
 * My Data service for self-service data management
 */
export const myDataService = {
	/**
	 * Get the authenticated user's data summary
	 */
	async getMyData(): Promise<ApiResult<import('./admin').UserDataSummary>> {
		return getClient().get<import('./admin').UserDataSummary>('/me/data');
	},

	/**
	 * Export user data as JSON file download
	 * Returns the full export object with metadata
	 */
	async exportMyData(): Promise<ApiResult<UserDataExport>> {
		return getClient().get<UserDataExport>('/me/data/export');
	},

	/**
	 * Trigger browser download of user data
	 */
	async downloadMyData(): Promise<void> {
		const baseUrl = getAuthApiUrl();
		const token = await authStore.getAccessToken();

		// Use fetch with blob response for file download
		const response = await fetch(`${baseUrl}/me/data/export`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Export failed: ${response.status}`);
		}

		const blob = await response.blob();
		const filename =
			response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
			`meine-daten-${new Date().toISOString().split('T')[0]}.json`;

		// Create download link
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteMyData(): Promise<ApiResult<import('./admin').DeleteUserDataResponse>> {
		return getClient().delete<import('./admin').DeleteUserDataResponse>('/me/data');
	},
};
