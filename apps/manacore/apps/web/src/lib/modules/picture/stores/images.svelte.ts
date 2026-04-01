/**
 * Images Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, toggle).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalImage } from '../types';
import { toImage } from '../queries';

let error = $state<string | null>(null);
let selectedImageId = $state<string | null>(null);
let showFavoritesOnly = $state(false);

export const imagesStore = {
	get error() {
		return error;
	},
	get selectedImageId() {
		return selectedImageId;
	},
	get showFavoritesOnly() {
		return showFavoritesOnly;
	},

	setSelectedImage(id: string | null) {
		selectedImageId = id;
	},

	toggleFavoritesFilter() {
		showFavoritesOnly = !showFavoritesOnly;
	},

	/**
	 * Toggle favorite status of an image.
	 */
	async toggleFavorite(id: string, currentIsFavorite: boolean) {
		error = null;
		try {
			await db.table('images').update(id, {
				isFavorite: !currentIsFavorite,
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to toggle favorite';
			return { success: false, error };
		}
	},

	/**
	 * Archive an image.
	 */
	async archiveImage(id: string) {
		error = null;
		try {
			await db.table('images').update(id, {
				archivedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to archive image';
			return { success: false, error };
		}
	},

	/**
	 * Restore an archived image.
	 */
	async restoreImage(id: string) {
		error = null;
		try {
			await db.table('images').update(id, {
				archivedAt: null,
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to restore image';
			return { success: false, error };
		}
	},

	/**
	 * Delete an image -- soft-deletes from IndexedDB instantly.
	 */
	async deleteImage(id: string) {
		error = null;
		try {
			await db.table('images').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete image';
			return { success: false, error };
		}
	},
};
