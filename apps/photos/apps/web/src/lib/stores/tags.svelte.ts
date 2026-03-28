/**
 * Tag Store — Local-First via Shared Tag Store
 *
 * Core tag CRUD is handled by the shared local-first tag store.
 * Photo-specific tag operations (junction table) go through the Photos backend.
 */

export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
} from '@manacore/shared-stores';

import { api } from '$lib/api/client';
import type { Tag } from '@photos/shared';

/**
 * Photo-specific tag operations (junction table: photo <-> tag).
 * These go through the Photos backend, not the shared tag store.
 */
export const photoTagOps = {
	/** Get tags for a photo */
	async getPhotoTags(mediaId: string): Promise<Tag[]> {
		try {
			const result = await api.get<Tag[]>(`/photos/${mediaId}/tags`);
			if (result.data) {
				return result.data;
			}
			return [];
		} catch (e) {
			console.error('Failed to get photo tags:', e);
			return [];
		}
	},

	/** Add tag to photo */
	async addTagToPhoto(mediaId: string, tagId: string) {
		try {
			const result = await api.post(`/photos/${mediaId}/tags/${tagId}`);
			return !result.error;
		} catch (e) {
			console.error('Failed to add tag to photo:', e);
			return false;
		}
	},

	/** Remove tag from photo */
	async removeTagFromPhoto(mediaId: string, tagId: string) {
		try {
			const result = await api.delete(`/photos/${mediaId}/tags/${tagId}`);
			return !result.error;
		} catch (e) {
			console.error('Failed to remove tag from photo:', e);
			return false;
		}
	},

	/** Set all tags for a photo */
	async setPhotoTags(mediaId: string, tagIds: string[]) {
		try {
			const result = await api.patch(`/photos/${mediaId}/tags`, { tagIds });
			return !result.error;
		} catch (e) {
			console.error('Failed to set photo tags:', e);
			return false;
		}
	},
};
