/**
 * Explore API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';
import type { Image } from './images';

export interface GetPublicImagesParams {
	page?: number;
	limit?: number;
	sortBy?: 'recent' | 'popular' | 'trending';
	favoritesOnly?: boolean;
}

export async function getPublicImages({
	page = 1,
	limit = 20,
	sortBy = 'recent',
	favoritesOnly = false,
}: GetPublicImagesParams = {}): Promise<Image[]> {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		sortBy,
		favoritesOnly: String(favoritesOnly),
	});

	const { data, error } = await fetchApi<Image[]>(`/explore?${params}`);
	if (error) throw error;
	return data || [];
}

export async function searchPublicImages(
	searchTerm: string,
	page = 1,
	limit = 20,
	favoritesOnly = false
): Promise<Image[]> {
	const params = new URLSearchParams({
		q: searchTerm,
		page: String(page),
		limit: String(limit),
		favoritesOnly: String(favoritesOnly),
	});

	const { data, error } = await fetchApi<Image[]>(`/explore/search?${params}`);
	if (error) throw error;
	return data || [];
}
