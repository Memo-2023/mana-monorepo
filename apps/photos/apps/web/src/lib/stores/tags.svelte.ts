/**
 * Tags Store - Uses shared Tag Store backed by central mana-core-auth
 *
 * Wraps createTagStore for backward compatibility with existing tagStore interface.
 * Also preserves photo-specific tag operations (getPhotoTags, addTagToPhoto, etc.)
 * which go through the Photos backend, not mana-core-auth.
 */

import { browser } from '$app/environment';
import { createTagStore, type TagStore } from '@manacore/shared-stores';
import { authStore } from '$lib/stores/auth.svelte';
import { api } from '$lib/api/client';
import type { Tag } from '@photos/shared';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

// Create the shared tag store
const sharedTagStore: TagStore = createTagStore({
	authUrl: getAuthUrl(),
	getToken: () => authStore.getValidToken(),
});

// Backward-compatible tagStore wrapper
export const tagStore = {
	// Getters (delegate to shared store)
	get tags() {
		return sharedTagStore.tags;
	},
	get loading() {
		return sharedTagStore.loading;
	},
	get error() {
		return sharedTagStore.error;
	},

	/**
	 * Load all tags
	 */
	async loadTags() {
		return sharedTagStore.fetchTags();
	},

	/**
	 * Create new tag
	 */
	async createTag(data: { name: string; color?: string }) {
		try {
			const tag = await sharedTagStore.createTag(data);
			return tag;
		} catch {
			return null;
		}
	},

	/**
	 * Update tag
	 */
	async updateTag(id: string, data: { name?: string; color?: string }) {
		try {
			const tag = await sharedTagStore.updateTag(id, data);
			return tag;
		} catch {
			return null;
		}
	},

	/**
	 * Delete tag
	 */
	async deleteTag(id: string) {
		try {
			await sharedTagStore.deleteTag(id);
			return true;
		} catch {
			return false;
		}
	},

	/**
	 * Get tags for a photo (from Photos backend)
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
	 * Add tag to photo (from Photos backend)
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
	 * Remove tag from photo (from Photos backend)
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
	 * Set all tags for a photo (from Photos backend)
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
		sharedTagStore.clear();
	},
};
