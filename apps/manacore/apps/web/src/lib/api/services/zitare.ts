/**
 * Zitare API Service
 *
 * Fetches favorite quotes from the Zitare backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const ZITARE_API_URL = import.meta.env.PUBLIC_ZITARE_API_URL || 'http://localhost:3007/api/v1';

const client = createApiClient(ZITARE_API_URL);

/**
 * Favorite entity from Zitare backend
 */
export interface Favorite {
	id: string;
	userId: string;
	quoteId: string;
	createdAt: string;
}

/**
 * Quote data (may need to be enriched from a quotes API)
 */
export interface Quote {
	id: string;
	text: string;
	author?: string;
	source?: string;
	category?: string;
}

/**
 * List entity from Zitare backend
 */
export interface QuoteList {
	id: string;
	userId: string;
	name: string;
	description?: string;
	quoteIds: string[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Zitare service for dashboard widgets
 */
export const zitareService = {
	/**
	 * Get user's favorite quotes
	 */
	async getFavorites(): Promise<ApiResult<Favorite[]>> {
		return client.get<Favorite[]>('/favorites');
	},

	/**
	 * Get a random favorite quote
	 */
	async getRandomFavorite(): Promise<ApiResult<Favorite | null>> {
		const result = await this.getFavorites();

		if (result.error || !result.data || result.data.length === 0) {
			return { data: null, error: result.error || 'No favorites found' };
		}

		const randomIndex = Math.floor(Math.random() * result.data.length);
		return { data: result.data[randomIndex], error: null };
	},

	/**
	 * Get user's quote lists
	 */
	async getLists(): Promise<ApiResult<QuoteList[]>> {
		return client.get<QuoteList[]>('/lists');
	},

	/**
	 * Get favorite count
	 */
	async getFavoriteCount(): Promise<ApiResult<number>> {
		const result = await this.getFavorites();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.length, error: null };
	},
};
