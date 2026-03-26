/**
 * Event Tags Store - Uses shared Tag Store backed by central mana-core-auth
 *
 * Wraps createTagStore to provide a backward-compatible eventTagsStore interface
 * that existing Calendar components (TagStripModal, EventForm, /tags page) rely on.
 */

import { browser } from '$app/environment';
import { createTagStore, type TagStore } from '@manacore/shared-stores';
import { authStore } from '$lib/stores/auth.svelte';
import type { Tag } from '@manacore/shared-tags';
import type { EventTag } from '@calendar/shared';

// Re-export EventTag for backward compatibility
export type { EventTag };

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

/**
 * Backward-compatible wrapper that returns { data, error } results
 * to match the old Calendar API client pattern used by TagStripModal.
 */
async function wrapResult<T>(
	fn: () => Promise<T>
): Promise<{ data: T | null; error: { message: string } | null }> {
	try {
		const data = await fn();
		return { data, error: null };
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		return { data: null, error: { message } };
	}
}

// Backward-compatible eventTagsStore wrapper
export const eventTagsStore = {
	get tags() {
		return tagStore.tags as unknown as EventTag[];
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
		return tagStore.getById(id) as unknown as EventTag | undefined;
	},

	getByIds(ids: string[]) {
		return tagStore.getByIds(ids) as unknown as EventTag[];
	},

	async createTag(data: { name: string; color?: string; groupId?: string | null }) {
		return wrapResult(() => tagStore.createTag(data)) as Promise<{
			data: EventTag | null;
			error: { message: string } | null;
		}>;
	},

	async updateTag(id: string, data: { name?: string; color?: string; groupId?: string | null }) {
		return wrapResult(() => tagStore.updateTag(id, data)) as Promise<{
			data: EventTag | null;
			error: { message: string } | null;
		}>;
	},

	async deleteTag(id: string) {
		return wrapResult(() => tagStore.deleteTag(id));
	},

	clear() {
		tagStore.clear();
	},
};
