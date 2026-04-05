/**
 * Storage API Service
 *
 * Fetches file storage stats from the Storage backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Storage API URL dynamically at runtime
function getStorageApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		const injectedUrl = (window as unknown as { __PUBLIC_STORAGE_API_URL__?: string })
			.__PUBLIC_STORAGE_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	// Fallback for local development
	return 'http://localhost:3016/api/v1';
}

// Lazy-initialized client to ensure we get the correct URL at runtime
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getStorageApiUrl());
	}
	return _client;
}

/**
 * File entity from Storage backend
 */
export interface StorageFile {
	id: string;
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	storagePath: string;
	storageKey: string;
	parentFolderId?: string | null;
	isFavorite: boolean;
	currentVersion: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Storage stats from backend
 */
export interface StorageStats {
	totalFiles: number;
	totalSize: number;
	favoriteCount: number;
	recentFiles: StorageFile[];
}

/**
 * Storage service for dashboard widgets
 */
export const storageService = {
	/**
	 * Get storage statistics
	 */
	async getStats(): Promise<ApiResult<StorageStats>> {
		const result = await getClient().get<StorageStats>('/files/stats');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data, error: null };
	},

	/**
	 * Get recent files
	 */
	async getRecentFiles(limit: number = 5): Promise<ApiResult<StorageFile[]>> {
		const result = await this.getStats();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.recentFiles.slice(0, limit), error: null };
	},

	/**
	 * Format file size for display
	 */
	formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},
};
