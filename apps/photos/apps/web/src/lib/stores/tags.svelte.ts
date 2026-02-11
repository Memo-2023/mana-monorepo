/**
 * Tags Store - Manages tag state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
import type { Tag } from '@photos/shared';

// State
let tags = $state<Tag[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const tagStore = {
	// Getters
	get tags() {
		return tags;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Load all tags
	 */
	async loadTags() {
		loading = true;
		error = null;

		try {
			const result = await api.get<Tag[]>('/tags');
			if (result.error) {
				error = result.error.message;
				return;
			}
			if (result.data) {
				tags = result.data;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load tags';
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new tag
	 */
	async createTag(data: { name: string; color?: string }) {
		try {
			const result = await api.post<Tag>('/tags', data);
			if (result.error) {
				error = result.error.message;
				return null;
			}
			if (result.data) {
				tags = [...tags, result.data];
				return result.data;
			}
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create tag';
			return null;
		}
	},

	/**
	 * Update tag
	 */
	async updateTag(id: string, data: { name?: string; color?: string }) {
		try {
			const result = await api.patch<Tag>(`/tags/${id}`, data);
			if (result.error) {
				error = result.error.message;
				return null;
			}
			if (result.data) {
				tags = tags.map((t) => (t.id === id ? result.data! : t));
				return result.data;
			}
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update tag';
			return null;
		}
	},

	/**
	 * Delete tag
	 */
	async deleteTag(id: string) {
		try {
			const result = await api.delete(`/tags/${id}`);
			if (result.error) {
				error = result.error.message;
				return false;
			}
			tags = tags.filter((t) => t.id !== id);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete tag';
			return false;
		}
	},

	/**
	 * Get tags for a photo
	 */
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

	/**
	 * Add tag to photo
	 */
	async addTagToPhoto(mediaId: string, tagId: string) {
		try {
			const result = await api.post(`/photos/${mediaId}/tags/${tagId}`);
			return !result.error;
		} catch (e) {
			console.error('Failed to add tag to photo:', e);
			return false;
		}
	},

	/**
	 * Remove tag from photo
	 */
	async removeTagFromPhoto(mediaId: string, tagId: string) {
		try {
			const result = await api.delete(`/photos/${mediaId}/tags/${tagId}`);
			return !result.error;
		} catch (e) {
			console.error('Failed to remove tag from photo:', e);
			return false;
		}
	},

	/**
	 * Set all tags for a photo
	 */
	async setPhotoTags(mediaId: string, tagIds: string[]) {
		try {
			const result = await api.patch(`/photos/${mediaId}/tags`, { tagIds });
			return !result.error;
		} catch (e) {
			console.error('Failed to set photo tags:', e);
			return false;
		}
	},

	/**
	 * Reset store
	 */
	reset() {
		tags = [];
		loading = false;
		error = null;
	},
};
