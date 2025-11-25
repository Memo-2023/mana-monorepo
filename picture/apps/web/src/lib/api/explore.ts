import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

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
	favoritesOnly = false
}: GetPublicImagesParams) {
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let query = supabase
		.from('images')
		.select('*')
		.eq('is_public', true)
		.is('archived_at', null);

	// Filter by favorites
	if (favoritesOnly) {
		query = query.eq('is_favorite', true);
	}

	query = query.range(start, end);

	// Sort by different criteria
	if (sortBy === 'recent') {
		query = query.order('created_at', { ascending: false });
	} else if (sortBy === 'popular') {
		query = query.order('download_count', { ascending: false });
	} else if (sortBy === 'trending') {
		// Combine recency and popularity for trending
		query = query.order('created_at', { ascending: false });
	}

	const { data, error } = await query;

	if (error) throw error;
	return data as Image[];
}

export async function searchPublicImages(searchTerm: string, page = 1, limit = 20, favoritesOnly = false) {
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let query = supabase
		.from('images')
		.select('*')
		.eq('is_public', true)
		.is('archived_at', null)
		.ilike('prompt', `%${searchTerm}%`);

	// Filter by favorites
	if (favoritesOnly) {
		query = query.eq('is_favorite', true);
	}

	const { data, error } = await query
		.order('created_at', { ascending: false })
		.range(start, end);

	if (error) throw error;
	return data as Image[];
}
