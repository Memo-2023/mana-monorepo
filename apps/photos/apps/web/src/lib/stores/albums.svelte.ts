/**
 * Albums Store - Manages album state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
import { PhotosEvents } from '@manacore/shared-utils/analytics';
import type { Album, Photo } from '@photos/shared';

// State
let albums = $state<Album[]>([]);
let currentAlbum = $state<Album | null>(null);
let albumPhotos = $state<Photo[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const albumStore = {
	// Getters
	get albums() {
		return albums;
	},
	get currentAlbum() {
		return currentAlbum;
	},
	get albumPhotos() {
		return albumPhotos;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Load all albums
	 */
	async loadAlbums() {
		loading = true;
		error = null;

		try {
			const result = await api.get<Album[]>('/albums');
			if (result.error) {
				error = result.error.message;
				return;
			}
			if (result.data) {
				albums = result.data;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load albums';
		} finally {
			loading = false;
		}
	},

	/**
	 * Load single album with items
	 */
	async loadAlbum(id: string) {
		loading = true;
		error = null;

		try {
			const result = await api.get<Album & { items: Photo[] }>(`/albums/${id}`);
			if (result.error) {
				error = result.error.message;
				return;
			}
			if (result.data) {
				currentAlbum = result.data;
				albumPhotos = result.data.items || [];
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load album';
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new album
	 */
	async createAlbum(data: { name: string; description?: string }) {
		loading = true;
		error = null;

		try {
			const result = await api.post<Album>('/albums', data);
			if (result.error) {
				error = result.error.message;
				return null;
			}
			if (result.data) {
				albums = [...albums, result.data];
				PhotosEvents.albumCreated();
				return result.data;
			}
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create album';
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update album
	 */
	async updateAlbum(id: string, data: { name?: string; description?: string }) {
		try {
			const result = await api.patch<Album>(`/albums/${id}`, data);
			if (result.error) {
				error = result.error.message;
				return null;
			}
			if (result.data) {
				albums = albums.map((a) => (a.id === id ? result.data! : a));
				if (currentAlbum?.id === id) {
					currentAlbum = result.data;
				}
				return result.data;
			}
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update album';
			return null;
		}
	},

	/**
	 * Delete album
	 */
	async deleteAlbum(id: string) {
		try {
			const result = await api.delete(`/albums/${id}`);
			if (result.error) {
				error = result.error.message;
				return false;
			}
			albums = albums.filter((a) => a.id !== id);
			PhotosEvents.albumDeleted();
			if (currentAlbum?.id === id) {
				currentAlbum = null;
				albumPhotos = [];
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete album';
			return false;
		}
	},

	/**
	 * Add photos to album
	 */
	async addPhotosToAlbum(albumId: string, mediaIds: string[]) {
		try {
			const result = await api.post(`/albums/${albumId}/items`, { mediaIds });
			if (result.error) {
				error = result.error.message;
				return false;
			}
			PhotosEvents.photosAddedToAlbum(mediaIds.length);
			// Reload album to get updated items
			if (currentAlbum?.id === albumId) {
				await this.loadAlbum(albumId);
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add photos to album';
			return false;
		}
	},

	/**
	 * Remove photo from album
	 */
	async removePhotoFromAlbum(albumId: string, mediaId: string) {
		try {
			const result = await api.delete(`/albums/${albumId}/items/${mediaId}`);
			if (result.error) {
				error = result.error.message;
				return false;
			}
			albumPhotos = albumPhotos.filter((p) => p.id !== mediaId);
			PhotosEvents.photoRemovedFromAlbum();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove photo from album';
			return false;
		}
	},

	/**
	 * Set album cover
	 */
	async setCover(albumId: string, mediaId: string) {
		try {
			const result = await api.patch<Album>(`/albums/${albumId}/cover`, { mediaId });
			if (result.error) {
				error = result.error.message;
				return false;
			}
			if (result.data) {
				albums = albums.map((a) => (a.id === albumId ? result.data! : a));
				if (currentAlbum?.id === albumId) {
					currentAlbum = result.data;
				}
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to set album cover';
			return false;
		}
	},

	/**
	 * Clear current album
	 */
	clearCurrentAlbum() {
		currentAlbum = null;
		albumPhotos = [];
	},

	/**
	 * Reset store
	 */
	reset() {
		albums = [];
		currentAlbum = null;
		albumPhotos = [];
		loading = false;
		error = null;
	},
};
