/**
 * Photo Tag Store — Local-First via Dexie
 *
 * Tag CRUD and photo-tag junction table operations.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import type { LocalTag, LocalPhotoTag } from '../types';

// ─── Tag CRUD ─────────────────────────────────────────────

export function useAllPhotoTags() {
	return liveQuery(async () => {
		const all = await db.table<LocalTag>('photoTags').toArray();
		return all.filter((t) => !t.deletedAt);
	});
}

export function getTagById(tags: LocalTag[], id: string): LocalTag | undefined {
	return tags.find((t) => t.id === id);
}

export function getTagsByIds(tags: LocalTag[], ids: string[]): LocalTag[] {
	const idSet = new Set(ids);
	return tags.filter((t) => idSet.has(t.id));
}

export const tagMutations = {
	async createTag(data: { name: string; color?: string }): Promise<LocalTag | null> {
		try {
			const now = new Date().toISOString();
			const tag: LocalTag = {
				id: crypto.randomUUID(),
				name: data.name,
				color: data.color ?? null,
				createdAt: now,
				updatedAt: now,
			};
			await db.table('photoTags').add(tag);
			return tag;
		} catch (e) {
			console.error('Failed to create tag:', e);
			return null;
		}
	},

	async deleteTag(id: string): Promise<boolean> {
		try {
			const now = new Date().toISOString();
			await db.table('photoTags').update(id, { deletedAt: now, updatedAt: now });
			// Also soft-delete photo-tag associations
			const associations = await db.table<LocalPhotoTag>('photoMediaTags').toArray();
			for (const a of associations.filter((pt) => pt.tagId === id)) {
				await db.table('photoMediaTags').update(a.id, { deletedAt: now, updatedAt: now });
			}
			return true;
		} catch (e) {
			console.error('Failed to delete tag:', e);
			return false;
		}
	},
};

// ─── Photo-Tag Junction ───────────────────────────────────

export const photoTagOps = {
	/** Get tags for a photo */
	async getPhotoTags(mediaId: string): Promise<string[]> {
		try {
			const all = await db.table<LocalPhotoTag>('photoMediaTags').toArray();
			return all.filter((pt) => pt.mediaId === mediaId && !pt.deletedAt).map((pt) => pt.tagId);
		} catch (e) {
			console.error('Failed to get photo tags:', e);
			return [];
		}
	},

	/** Add tag to photo */
	async addTagToPhoto(mediaId: string, tagId: string) {
		try {
			const all = await db.table<LocalPhotoTag>('photoMediaTags').toArray();
			const exists = all.some(
				(pt) => pt.mediaId === mediaId && pt.tagId === tagId && !pt.deletedAt
			);
			if (exists) return true;

			const now = new Date().toISOString();
			await db.table('photoMediaTags').add({
				id: crypto.randomUUID(),
				mediaId,
				tagId,
				createdAt: now,
				updatedAt: now,
			});
			return true;
		} catch (e) {
			console.error('Failed to add tag to photo:', e);
			return false;
		}
	},

	/** Remove tag from photo */
	async removeTagFromPhoto(mediaId: string, tagId: string) {
		try {
			const all = await db.table<LocalPhotoTag>('photoMediaTags').toArray();
			const item = all.find((pt) => pt.mediaId === mediaId && pt.tagId === tagId && !pt.deletedAt);
			if (item) {
				const now = new Date().toISOString();
				await db.table('photoMediaTags').update(item.id, { deletedAt: now, updatedAt: now });
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
			const now = new Date().toISOString();
			// Soft-delete existing tags for this photo
			const all = await db.table<LocalPhotoTag>('photoMediaTags').toArray();
			const existing = all.filter((pt) => pt.mediaId === mediaId && !pt.deletedAt);
			for (const item of existing) {
				await db.table('photoMediaTags').update(item.id, { deletedAt: now, updatedAt: now });
			}

			// Add new tags
			for (const tagId of tagIds) {
				await db.table('photoMediaTags').add({
					id: crypto.randomUUID(),
					mediaId,
					tagId,
					createdAt: now,
					updatedAt: now,
				});
			}
			return true;
		} catch (e) {
			console.error('Failed to set photo tags:', e);
			return false;
		}
	},
};
