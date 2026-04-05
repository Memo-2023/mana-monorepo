/**
 * Music API Service
 *
 * Fetches music library stats from the Music backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Music API URL dynamically at runtime
function getMusicApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MUSIC_API_URL__?: string })
			.__PUBLIC_MUSIC_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}`;
		}
	}
	return 'http://localhost:3010';
}

// Lazy-initialized client
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getMusicApiUrl());
	}
	return _client;
}

/**
 * Song entity from Music backend
 */
export interface Song {
	id: string;
	userId: string;
	title: string;
	artist?: string;
	album?: string;
	genre?: string;
	duration?: number;
	favorite: boolean;
	playCount: number;
	lastPlayedAt?: string;
	addedAt: string;
}

/**
 * Music library statistics
 */
export interface MusicStats {
	totalSongs: number;
	totalPlaylists: number;
	totalProjects: number;
	favoriteCount: number;
	totalPlayTime: number; // In seconds
}

/**
 * Music service for dashboard widgets
 */
export const musicService = {
	/**
	 * Get library statistics
	 */
	async getStats(): Promise<ApiResult<MusicStats>> {
		return getClient().get<MusicStats>('/library/stats');
	},

	/**
	 * Get recent songs
	 */
	async getRecentSongs(limit = 5): Promise<ApiResult<Song[]>> {
		return getClient().get<Song[]>(`/songs?limit=${limit}`);
	},

	/**
	 * Get favorite songs
	 */
	async getFavoriteSongs(limit = 5): Promise<ApiResult<Song[]>> {
		return getClient().get<Song[]>(`/songs?favorite=true&limit=${limit}`);
	},

	/**
	 * Format duration for display (seconds -> MM:SS or HH:MM:SS)
	 */
	formatDuration(seconds: number): string {
		if (seconds <= 0) return '0:00';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (h > 0) {
			return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		}
		return `${m}:${String(s).padStart(2, '0')}`;
	},
};
