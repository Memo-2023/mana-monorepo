/**
 * Images API - Using NestJS Backend
 */

import { fetchApi } from './client';

export interface Image {
	id: string;
	userId: string;
	generationId?: string;
	sourceImageId?: string;
	prompt: string;
	negativePrompt?: string;
	model?: string;
	style?: string;
	publicUrl?: string;
	storagePath: string;
	filename: string;
	format?: string;
	width?: number;
	height?: number;
	fileSize?: number;
	blurhash?: string;
	isPublic: boolean;
	isFavorite: boolean;
	downloadCount: number;
	rating?: number;
	archivedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetImagesParams {
	page?: number;
	limit?: number;
	archived?: boolean;
	tagIds?: string[];
	favoritesOnly?: boolean;
}

/**
 * Get images for the current user
 */
export async function getImages(params: GetImagesParams = {}): Promise<Image[]> {
	const { page = 1, limit = 20, archived = false, tagIds, favoritesOnly = false } = params;

	const searchParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		archived: String(archived),
		favoritesOnly: String(favoritesOnly),
	});

	if (tagIds && tagIds.length > 0) {
		searchParams.append('tagIds', tagIds.join(','));
	}

	const { data, error } = await fetchApi<Image[]>(`/images?${searchParams}`);
	if (error) throw error;
	return data || [];
}

/**
 * Get image by ID
 */
export async function getImageById(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}`);
	if (error) throw error;
	if (!data) throw new Error('Image not found');
	return data;
}

/**
 * Archive an image
 */
export async function archiveImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/archive`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to archive image');
	return data;
}

/**
 * Restore (unarchive) an image
 */
export async function restoreImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/unarchive`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to restore image');
	return data;
}

/**
 * Delete an image permanently
 */
export async function deleteImage(id: string): Promise<void> {
	const { error } = await fetchApi(`/images/${id}`, {
		method: 'DELETE',
	});
	if (error) throw error;
}

/**
 * Publish an image (make public)
 */
export async function publishImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/publish`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to publish image');
	return data;
}

/**
 * Unpublish an image (make private)
 */
export async function unpublishImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/unpublish`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to unpublish image');
	return data;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/favorite`, {
		method: 'PATCH',
		body: { isFavorite },
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to toggle favorite');
	return data;
}

/**
 * Get archived images count
 */
export async function getArchivedCount(): Promise<number> {
	const { data, error } = await fetchApi<{ count: number }>('/images/archived/count');
	if (error) throw error;
	return data?.count || 0;
}

/**
 * Get archived images
 */
export async function getArchivedImages(
	page = 1,
	limit = 20
): Promise<{
	items: Image[];
	total: number;
	hasMore: boolean;
}> {
	const images = await getImages({ page, limit, archived: true });
	// Note: Backend doesn't return total count in list, so we estimate hasMore
	return {
		items: images,
		total: images.length,
		hasMore: images.length === limit,
	};
}

/**
 * Batch archive multiple images
 */
export async function batchArchiveImages(imageIds: string[]): Promise<{ affected: number }> {
	const { data, error } = await fetchApi<{ affected: number }>('/images/batch/archive', {
		method: 'POST',
		body: { imageIds },
	});
	if (error) throw error;
	return data || { affected: 0 };
}

/**
 * Batch restore multiple images
 */
export async function batchRestoreImages(imageIds: string[]): Promise<{ affected: number }> {
	const { data, error } = await fetchApi<{ affected: number }>('/images/batch/restore', {
		method: 'POST',
		body: { imageIds },
	});
	if (error) throw error;
	return data || { affected: 0 };
}

/**
 * Batch delete multiple images
 */
export async function batchDeleteImages(imageIds: string[]): Promise<{ affected: number }> {
	const { data, error } = await fetchApi<{ affected: number }>('/images/batch/delete', {
		method: 'POST',
		body: { imageIds },
	});
	if (error) throw error;
	return data || { affected: 0 };
}

// ==================== LIKES ====================

export interface LikeStatus {
	liked: boolean;
	likeCount: number;
}

/**
 * Like an image
 */
export async function likeImage(imageId: string): Promise<LikeStatus> {
	const { data, error } = await fetchApi<LikeStatus>(`/images/${imageId}/like`, {
		method: 'POST',
	});
	if (error) throw error;
	return data || { liked: false, likeCount: 0 };
}

/**
 * Unlike an image
 */
export async function unlikeImage(imageId: string): Promise<LikeStatus> {
	const { data, error } = await fetchApi<LikeStatus>(`/images/${imageId}/like`, {
		method: 'DELETE',
	});
	if (error) throw error;
	return data || { liked: false, likeCount: 0 };
}

/**
 * Get like status for an image
 */
export async function getLikeStatus(imageId: string): Promise<LikeStatus> {
	const { data, error } = await fetchApi<LikeStatus>(`/images/${imageId}/likes`);
	if (error) throw error;
	return data || { liked: false, likeCount: 0 };
}

// ==================== GENERATION DETAILS ====================

export interface GenerationDetails {
	steps: number | null;
	guidanceScale: number | null;
	generationTimeSeconds: number | null;
	status: string;
}

/**
 * Get generation details for an image
 */
export async function getGenerationDetails(
	generationId: string
): Promise<GenerationDetails | null> {
	const { data, error } = await fetchApi<GenerationDetails>(`/images/generation/${generationId}`);
	if (error) throw error;
	return data || null;
}
