/**
 * Picture API Service
 *
 * Fetches recent AI-generated images from the Picture backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const PICTURE_API_URL = import.meta.env.PUBLIC_PICTURE_API_URL || 'http://localhost:3006';

const client = createApiClient(PICTURE_API_URL);

/**
 * Generated image entity from Picture backend
 */
export interface GeneratedImage {
	id: string;
	userId: string;
	prompt: string;
	negativePrompt?: string;
	imageUrl: string;
	thumbnailUrl?: string;
	width: number;
	height: number;
	model: string;
	seed?: number;
	steps?: number;
	cfgScale?: number;
	createdAt: string;
	isFavorite?: boolean;
	tags?: string[];
}

/**
 * Generation statistics
 */
export interface GenerationStats {
	totalGenerations: number;
	thisMonth: number;
	favoriteCount: number;
}

/**
 * Picture service for dashboard widgets
 */
export const pictureService = {
	/**
	 * Get user's recent generations
	 */
	async getRecentGenerations(limit = 6): Promise<ApiResult<GeneratedImage[]>> {
		return client.get<GeneratedImage[]>(`/api/generations?limit=${limit}&sort=createdAt:desc`);
	},

	/**
	 * Get user's favorite images
	 */
	async getFavorites(limit = 6): Promise<ApiResult<GeneratedImage[]>> {
		return client.get<GeneratedImage[]>(`/api/generations?favorite=true&limit=${limit}`);
	},

	/**
	 * Get generation statistics
	 */
	async getStats(): Promise<ApiResult<GenerationStats>> {
		return client.get<GenerationStats>('/api/stats');
	},

	/**
	 * Get total generation count
	 */
	async getGenerationCount(): Promise<ApiResult<number>> {
		const result = await this.getStats();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.totalGenerations, error: null };
	},
};
