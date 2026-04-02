/**
 * Tag Store — Local-First via Shared Tag Store
 *
 * Core tag CRUD is handled by the shared local-first tag store.
 * Photo-specific tag operations (junction table) are local-first via Dexie.
 */

export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
} from '@manacore/shared-stores';

import { photoTagCollection, type LocalPhotoTag } from '$lib/data/local-store';

/**
 * Photo-specific tag operations (junction table: photo <-> tag).
 * Local-first via Dexie — syncs to server in the background.
 */
export const photoTagOps = {
	/** Get tags for a photo */
	async getPhotoTags(mediaId: string): Promise<string[]> {
		try {
			const all = await photoTagCollection.getAll();
			return all.filter((pt) => pt.mediaId === mediaId).map((pt) => pt.tagId);
		} catch (e) {
			console.error('Failed to get photo tags:', e);
			return [];
		}
	},

	/** Add tag to photo */
	async addTagToPhoto(mediaId: string, tagId: string) {
		try {
			// Check if already exists
			const all = await photoTagCollection.getAll();
			const exists = all.some((pt) => pt.mediaId === mediaId && pt.tagId === tagId);
			if (exists) return true;

			await photoTagCollection.insert({
				id: crypto.randomUUID(),
				mediaId,
				tagId,
			} as LocalPhotoTag);
			return true;
		} catch (e) {
			console.error('Failed to add tag to photo:', e);
			return false;
		}
	},

	/** Remove tag from photo */
	async removeTagFromPhoto(mediaId: string, tagId: string) {
		try {
			const all = await photoTagCollection.getAll();
			const item = all.find((pt) => pt.mediaId === mediaId && pt.tagId === tagId);
			if (item) {
				await photoTagCollection.delete(item.id);
			}
			return true;
		} catch (e) {
			console.error('Failed to remove tag from photo:', e);
			return false;
		}
	},

	/** Set all tags for a photo (replace) */
	async setPhotoTags(mediaId: string, tagIds: string[]) {
		try {
			// Remove existing tags for this photo
			const all = await photoTagCollection.getAll();
			const existing = all.filter((pt) => pt.mediaId === mediaId);
			for (const item of existing) {
				await photoTagCollection.delete(item.id);
			}

			// Add new tags
			for (const tagId of tagIds) {
				await photoTagCollection.insert({
					id: crypto.randomUUID(),
					mediaId,
					tagId,
				} as LocalPhotoTag);
			}
			return true;
		} catch (e) {
			console.error('Failed to set photo tags:', e);
			return false;
		}
	},
};
