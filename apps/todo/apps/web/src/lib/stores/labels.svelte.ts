/**
 * Labels Store - Uses shared Tag Store backed by central mana-core-auth
 */

import { browser } from '$app/environment';
import { createTagStore, type TagStore } from '@manacore/shared-stores';
import { authStore } from '$lib/stores/auth.svelte';
import type { Tag } from '@manacore/shared-tags';

// Re-export Tag as Label for backward compatibility
export type Label = Tag;

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

// Backward-compatible labelsStore wrapper
export const labelsStore = {
	get labels() {
		return tagStore.tags;
	},
	get loading() {
		return tagStore.loading;
	},
	get error() {
		return tagStore.error;
	},

	async fetchLabels() {
		return tagStore.fetchTags();
	},
	getById(id: string) {
		return tagStore.getById(id);
	},
	getColor(labelId: string) {
		return tagStore.getColor(labelId);
	},

	async createLabel(data: { name: string; color?: string }) {
		return tagStore.createTag(data);
	},
	async updateLabel(id: string, data: { name?: string; color?: string }) {
		return tagStore.updateTag(id, data);
	},
	async deleteLabel(id: string) {
		return tagStore.deleteTag(id);
	},
	clear() {
		tagStore.clear();
	},
};
