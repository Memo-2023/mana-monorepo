/**
 * Photos Store — Server-fetched photos from mana-media + local-first mutations.
 *
 * Photo files live on mana-media (server-side, not in Dexie).
 * Favorites are local-first via Dexie — reads handled by live queries in queries.ts.
 * This store handles server-fetched photo listing, selection, and favorite mutations.
 */

import { favoriteCollection, type LocalFavorite } from '$lib/data/local-store';
import { authStore } from '$lib/stores/auth.svelte';
import { PhotosEvents } from '@manacore/shared-utils/analytics';
import type { Photo, PhotoFilters, PhotoStats } from '@photos/shared';

const MEDIA_URL = () =>
	(typeof window !== 'undefined'
		? (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string }).__PUBLIC_MANA_MEDIA_URL__
		: null) ||
	import.meta.env.PUBLIC_MANA_MEDIA_URL ||
	'http://localhost:3015';

async function mediaFetch<T>(path: string, options: RequestInit = {}): Promise<T | null> {
	const token = await authStore.getValidToken();
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers,
	};
	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${MEDIA_URL()}/api/v1${path}`, { ...options, headers });
	if (!response.ok) return null;
	return response.json();
}

// State — server-fetched photos (not local-first)
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

			const result = await mediaFetch<{ items: Photo[]; total: number; hasMore: boolean }>(
				`/media/list/all?${params.toString()}`
			);

			if (result) {
				photos = reset ? result.items : [...photos, ...result.items];
				hasMore = result.hasMore;
				filters = { ...filters, offset: (filters.offset || 0) + result.items.length };
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load photos';
		} finally {
			loading = false;
		}
	},

	async loadMore() {
		if (!hasMore || loading) return;
		await this.loadPhotos(false);
	},

	async setFilters(newFilters: Partial<PhotoFilters>) {
		filters = { ...filters, ...newFilters, offset: 0 };
		PhotosEvents.filtersApplied();
		await this.loadPhotos(true);
	},

	async loadStats() {
		try {
			const result = await mediaFetch<PhotoStats>('/media/stats');
			if (result) stats = result;
		} catch (e) {
			console.error('Failed to load stats:', e);
		}
	},

	selectPhoto(photo: Photo | null) {
		selectedPhoto = photo;
	},

	/** Toggle favorite — local-first via Dexie. Live query handles read reactivity. */
	async toggleFavorite(mediaId: string) {
		try {
			const existing = await favoriteCollection.getAll();
			const fav = existing.find((f) => f.mediaId === mediaId);
			let isFavorited: boolean;

			if (fav) {
				await favoriteCollection.delete(fav.id);
				isFavorited = false;
			} else {
				await favoriteCollection.insert({
					id: crypto.randomUUID(),
					mediaId,
				} as LocalFavorite);
				isFavorited = true;
			}

			PhotosEvents.photoFavorited(isFavorited);
			// Update server-fetched photos in-memory for immediate UI feedback
			photos = photos.map((p) => (p.id === mediaId ? { ...p, isFavorited } : p));
			if (selectedPhoto?.id === mediaId) {
				selectedPhoto = { ...selectedPhoto, isFavorited };
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
		}
	},

	async deletePhoto(mediaId: string) {
		try {
			const token = await authStore.getValidToken();
			const response = await fetch(`${MEDIA_URL()}/api/v1/media/${mediaId}`, {
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			if (!response.ok) {
				error = 'Failed to delete photo';
				return false;
			}

			photos = photos.filter((p) => p.id !== mediaId);
			PhotosEvents.photoDeleted();
			if (selectedPhoto?.id === mediaId) selectedPhoto = null;
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete photo';
			return false;
		}
	},

	reset() {
		photos = [];
		loading = false;
		error = null;
		hasMore = true;
		filters = { limit: 50, offset: 0, sortBy: 'dateTaken', sortOrder: 'desc' };
		stats = null;
		selectedPhoto = null;
	},
};
