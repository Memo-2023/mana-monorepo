/**
 * Images Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, toggle).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import { encryptRecord } from '$lib/data/crypto';
import { createArchiveOps, toggleField } from '@mana/shared-stores';
import { PictureEvents, trackEvent } from '@mana/shared-utils/analytics';
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

	/**
	 * Insert a freshly-generated image. This is the canonical path for
	 * any future image-generation flow (currently the
	 * /picture/generate route is a stub) — it wraps the user-typed
	 * `prompt` and `negativePrompt` fields via encryptRecord so the
	 * generated image lands in IndexedDB with the same encryption
	 * envelope as locally-edited rows.
	 *
	 * Why this is the only safe way to insert an image: server-side
	 * code (the eventual image-gen API + sync push) cannot encrypt
	 * under the user's master key — it lives in the browser. So the
	 * generation flow MUST round-trip through the client store, even
	 * if the actual AI call happens server-side. The pattern is:
	 *
	 *   1. Client posts { prompt, negativePrompt, ... } to image-gen API
	 *   2. Server returns { storagePath, generationId, dimensions, ... }
	 *   3. Client calls imagesStore.insert(...) with both halves
	 *   4. encryptRecord seals the prompt fields before the IndexedDB
	 *      write; sync pushes the encrypted row to the backend
	 *
	 * The mixed-state guarantee from picture/queries.ts already covers
	 * the migration window where some images came in via legacy
	 * server-side push and others through this path — decryptRecord
	 * passes plaintext through and unwraps ciphertext blobs.
	 */
	async insert(image: LocalImage) {
		await encryptRecord('images', image);
		await imageTable().add(image);
		trackEvent('image_created', { module: 'picture' });
	},
};
