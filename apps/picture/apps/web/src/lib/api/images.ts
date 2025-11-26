import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

export interface GetImagesParams {
	userId: string;
	page?: number;
	limit?: number;
	archived?: boolean;
	tagIds?: string[];
	favoritesOnly?: boolean;
}

export async function getImages({ userId, page = 1, limit = 20, archived = false, tagIds, favoritesOnly = false }: GetImagesParams) {
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let query = supabase
		.from('images')
		.select('*')
		.eq('user_id', userId);

	// Filter by archived_at: NULL = active, NOT NULL = archived
	if (archived) {
		query = query.not('archived_at', 'is', null);
	} else {
		query = query.is('archived_at', null);
	}

	// Filter by favorites
	if (favoritesOnly) {
		query = query.eq('is_favorite', true);
	}

	// Filter by tags if provided
	if (tagIds && tagIds.length > 0) {
		// Get image IDs that have ALL selected tags
		const { data: imageTagsData, error: imageTagsError } = await supabase
			.from('image_tags')
			.select('image_id')
			.in('tag_id', tagIds);

		if (imageTagsError) throw imageTagsError;

		// Count occurrences of each image_id
		const imageIdCounts = imageTagsData?.reduce((acc: Record<string, number>, item) => {
			acc[item.image_id] = (acc[item.image_id] || 0) + 1;
			return acc;
		}, {});

		// Filter to only images that have all selected tags
		const imageIds = Object.entries(imageIdCounts || {})
			.filter(([_, count]) => count === tagIds.length)
			.map(([imageId, _]) => imageId);

		if (imageIds.length === 0) {
			return []; // No images match all tags
		}

		query = query.in('id', imageIds);
	}

	const { data, error } = await query
		.order('created_at', { ascending: false })
		.range(start, end);

	if (error) throw error;
	return data as Image[];
}

export async function getImageById(id: string) {
	const { data, error } = await supabase
		.from('images')
		.select('*')
		.eq('id', id)
		.single();

	if (error) throw error;
	return data as Image;
}

export async function archiveImage(id: string) {
	console.log('[archiveImage] Archiving image:', id);

	const { data, error } = await supabase
		.from('images')
		.update({ archived_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('[archiveImage] Error:', error);
		throw error;
	}

	console.log('[archiveImage] Success:', data);
	return data as Image;
}

export async function unarchiveImage(id: string) {
	const { data, error } = await supabase
		.from('images')
		.update({ archived_at: null })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data as Image;
}

export async function deleteImage(id: string) {
	const { error } = await supabase
		.from('images')
		.delete()
		.eq('id', id);

	if (error) throw error;
}

export async function downloadImage(url: string, filename: string) {
	const response = await fetch(url);
	const blob = await response.blob();
	const downloadUrl = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = downloadUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(downloadUrl);
}

export async function publishImage(id: string) {
	const { data, error } = await supabase
		.from('images')
		.update({ is_public: true })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data as Image;
}

export async function unpublishImage(id: string) {
	const { data, error } = await supabase
		.from('images')
		.update({ is_public: false })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data as Image;
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
	console.log('[toggleFavorite] Toggling favorite:', id, 'to', isFavorite);

	const { data, error } = await supabase
		.from('images')
		.update({ is_favorite: isFavorite })
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('[toggleFavorite] Error:', error);
		throw error;
	}

	console.log('[toggleFavorite] Success:', data);
	return data as Image;
}
