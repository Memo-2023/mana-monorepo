/**
 * Tags Store - Uses shared Tag Store backed by central mana-core-auth
 */

import { browser } from '$app/environment';
import { createTagStore, type TagStore } from '@manacore/shared-stores';
import { authStore } from '$lib/stores/auth.svelte';
import type { Tag } from '@manacore/shared-tags';

// Re-export Tag for convenience
export type { Tag };

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

// Create the shared tag store
const tagStore: TagStore = createTagStore({
	authUrl: getAuthUrl(),
	getToken: () => authStore.getValidToken(),
});

// Export the store with a backward-compatible wrapper
export const tagsStore = {
	get tags() {
		return tagStore.tags;
	},
	get loading() {
		return tagStore.loading;
	},
	get error() {
		return tagStore.error;
	},

	async fetchTags() {
		return tagStore.fetchTags();
	},
	getById(id: string) {
		return tagStore.getById(id);
	},
	getColor(tagId: string) {
		return tagStore.getColor(tagId);
	},

	async createTag(data: { name: string; color?: string }) {
		return tagStore.createTag(data);
	},
	async updateTag(id: string, data: { name?: string; color?: string }) {
		return tagStore.updateTag(id, data);
	},
	async deleteTag(id: string) {
		return tagStore.deleteTag(id);
	},
	clear() {
		tagStore.clear();
	},
};
