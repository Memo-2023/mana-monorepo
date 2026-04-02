/**
 * Images Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, toggle).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import { createArchiveOps, toggleField } from '@manacore/shared-stores';
import { PictureEvents, trackEvent } from '@manacore/shared-utils/analytics';
import type { LocalImage } from '../types';

const imageTable = () => db.table<LocalImage>('images');

/** Archive/soft-delete ops for images. */
export const imageArchive = createArchiveOps({ table: imageTable });

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

	async toggleFavorite(id: string) {
		error = null;
		try {
			await toggleField(imageTable(), id, 'isFavorite');
			PictureEvents.imageFavorited();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to toggle favorite';
			return { success: false, error };
		}
	},

	// Archive ops (delegated to shared factory)
	archiveImage: (id: string) => imageArchive.archive(id),
	restoreImage: (id: string) => imageArchive.unarchive(id),
	async deleteImage(id: string) {
		await imageArchive.softDelete(id);
		trackEvent('image_deleted', { module: 'picture' });
	},
};
