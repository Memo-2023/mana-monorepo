/**
 * Presi API Service
 *
 * Fetches presentation decks from the Presi backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Presi API URL dynamically at runtime
function getPresiApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_PRESI_API_URL__?: string })
			.__PUBLIC_PRESI_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api`;
		}
	}
	return 'http://localhost:3008/api';
}

// Lazy-initialized client
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getPresiApiUrl());
	}
	return _client;
}

/**
 * Deck entity from Presi backend
 */
export interface PresiDeck {
	id: string;
	userId: string;
	title: string;
	description?: string;
	themeId?: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Presi statistics
 */
export interface PresiStats {
	totalDecks: number;
	publicDecks: number;
	recentDecks: PresiDeck[];
}

/**
 * Presi service for dashboard widgets
 */
export const presiService = {
	/**
	 * Get user's decks
	 */
	async getDecks(): Promise<ApiResult<PresiDeck[]>> {
		return getClient().get<PresiDeck[]>('/decks');
	},

	/**
	 * Get recent decks
	 */
	async getRecentDecks(limit = 5): Promise<ApiResult<PresiDeck[]>> {
		const result = await this.getDecks();

		if (result.error || !result.data) {
			return result;
		}

		const sorted = result.data
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, limit);

		return { data: sorted, error: null };
	},

	/**
	 * Get deck count
	 */
	async getDeckCount(): Promise<ApiResult<{ total: number; public: number }>> {
		const result = await this.getDecks();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return {
			data: {
				total: result.data.length,
				public: result.data.filter((d) => d.isPublic).length,
			},
			error: null,
		};
	},
};
