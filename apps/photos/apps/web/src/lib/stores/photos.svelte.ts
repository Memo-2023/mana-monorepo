/**
 * Photos Store - Manages photo gallery state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
import type { Photo, PhotoFilters, PhotoStats } from '@photos/shared';

// State
let photos = $state<Photo[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let hasMore = $state(true);
let filters = $state<PhotoFilters>({
	limit: 50,
	offset: 0,
	sortBy: 'dateTaken',
	sortOrder: 'desc',
});
let stats = $state<PhotoStats | null>(null);
let selectedPhoto = $state<Photo | null>(null);

export const photoStore = {
	// Getters
	get photos() {
		return photos;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get hasMore() {
		return hasMore;
	},
	get filters() {
		return filters;
	},
	get stats() {
		return stats;
	},
	get selectedPhoto() {
		return selectedPhoto;
	},

	/**
	 * Load photos with current filters
	 */
	async loadPhotos(reset = false) {
		if (loading) return;

		if (reset) {
			photos = [];
			filters = { ...filters, offset: 0 };
			hasMore = true;
		}

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			if (filters.apps?.length) params.set('apps', filters.apps.join(','));
			if (filters.mimeType) params.set('mimeType', filters.mimeType);
			if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
			if (filters.dateTo) params.set('dateTo', filters.dateTo);
			if (filters.hasLocation !== undefined) params.set('hasLocation', String(filters.hasLocation));
			params.set('limit', String(filters.limit || 50));
			params.set('offset', String(filters.offset || 0));
			params.set('sortBy', filters.sortBy || 'dateTaken');
			params.set('sortOrder', filters.sortOrder || 'desc');

			const result = await api.get<{ items: Photo[]; total: number; hasMore: boolean }>(
				`/photos?${params.toString()}`
			);

			if (result.error) {
				error = result.error.message;
				return;
			}

			if (result.data) {
				photos = reset ? result.data.items : [...photos, ...result.data.items];
				hasMore = result.data.hasMore;
				filters = { ...filters, offset: (filters.offset || 0) + result.data.items.length };
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load photos';
		} finally {
			loading = false;
		}
	},

	/**
	 * Load more photos (pagination)
	 */
	async loadMore() {
		if (!hasMore || loading) return;
		await this.loadPhotos(false);
	},

	/**
	 * Update filters and reload
	 */
	async setFilters(newFilters: Partial<PhotoFilters>) {
		filters = { ...filters, ...newFilters, offset: 0 };
		await this.loadPhotos(true);
	},

	/**
	 * Load photo statistics
	 */
	async loadStats() {
		try {
			const result = await api.get<PhotoStats>('/photos/stats');
			if (result.data) {
				stats = result.data;
			}
		} catch (e) {
			console.error('Failed to load stats:', e);
		}
	},

	/**
	 * Select a photo for detail view
	 */
	selectPhoto(photo: Photo | null) {
		selectedPhoto = photo;
	},

	/**
	 * Toggle favorite status
	 */
	async toggleFavorite(mediaId: string) {
		try {
			const result = await api.post<{ isFavorited: boolean }>(`/favorites/${mediaId}/toggle`);
			if (result.data) {
				// Update photo in list
				photos = photos.map((p) =>
					p.id === mediaId ? { ...p, isFavorited: result.data!.isFavorited } : p
				);
				// Update selected photo if it's the same
				if (selectedPhoto?.id === mediaId) {
					selectedPhoto = { ...selectedPhoto, isFavorited: result.data.isFavorited };
				}
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
		}
	},

	/**
	 * Delete a photo
	 */
	async deletePhoto(mediaId: string) {
		try {
			const result = await api.delete(`/photos/${mediaId}`);
			if (result.error) {
				error = result.error.message;
				return false;
			}
			photos = photos.filter((p) => p.id !== mediaId);
			if (selectedPhoto?.id === mediaId) {
				selectedPhoto = null;
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete photo';
			return false;
		}
	},

	/**
	 * Clear all state
	 */
	reset() {
		photos = [];
		loading = false;
		error = null;
		hasMore = true;
		filters = {
			limit: 50,
			offset: 0,
			sortBy: 'dateTaken',
			sortOrder: 'desc',
		};
		stats = null;
		selectedPhoto = null;
	},
};
