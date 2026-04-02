/**
 * Images API - Now using Backend API instead of direct Supabase calls
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

export async function getImages({
	page = 1,
	limit = 20,
	archived = false,
	tagIds,
	favoritesOnly = false,
}: GetImagesParams = {}): Promise<Image[]> {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		archived: String(archived),
		favoritesOnly: String(favoritesOnly),
	});

	if (tagIds && tagIds.length > 0) {
		params.append('tagIds', tagIds.join(','));
	}

	const { data, error } = await fetchApi<Image[]>(`/images?${params}`);
	if (error) throw error;
	return data || [];
}

export async function getImageById(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}`);
	if (error) throw error;
	if (!data) throw new Error('Image not found');
	return data;
}

export async function archiveImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/archive`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to archive image');
	return data;
}

export async function unarchiveImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/unarchive`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to unarchive image');
	return data;
}

export async function deleteImage(id: string): Promise<void> {
	const { error } = await fetchApi(`/images/${id}`, {
		method: 'DELETE',
	});
	if (error) throw error;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
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

export async function publishImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/publish`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to publish image');
	return data;
}

export async function unpublishImage(id: string): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/unpublish`, {
		method: 'PATCH',
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to unpublish image');
	return data;
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Image> {
	const { data, error } = await fetchApi<Image>(`/images/${id}/favorite`, {
		method: 'PATCH',
		body: { isFavorite },
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to toggle favorite');
	return data;
}
