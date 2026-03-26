/**
 * Tags Store - Uses shared Tag Store backed by central mana-core-auth
 *
 * Replaces old Svelte 4 writable stores with createTagStore wrapper.
 * Exports writable-compatible stores for backward compatibility with existing consumers.
 */

import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import { createTagStore, type TagStore } from '@manacore/shared-stores';
import { authStore } from '$lib/stores/auth.svelte';
import type { Tag } from '@manacore/shared-tags';

// Re-export Tag for backward compatibility with '$lib/api/tags' Tag type
export type { Tag };

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

// Create the shared tag store (Svelte 5 runes-based)
const sharedTagStore: TagStore = createTagStore({
	authUrl: getAuthUrl(),
	getToken: () => authStore.getValidToken(),
});

// Backward-compatible writable stores for existing consumers
// These are kept as writables so $tags and $selectedTags syntax still works
export const tags = writable<Tag[]>([]);
export const selectedTags = writable<string[]>([]);
export const isLoadingTags = writable<boolean>(false);

/**
 * Fetch tags from the shared store and sync to the writable store.
 * Call this on mount instead of using the old getAllTags() API function.
 */
export async function fetchAndSyncTags(): Promise<void> {
	isLoadingTags.set(true);
	try {
		await sharedTagStore.fetchTags();
		tags.set(sharedTagStore.tags);
	} catch (e) {
		console.error('Failed to fetch tags:', e);
	} finally {
		isLoadingTags.set(false);
	}
}

/**
 * Direct access to the shared tag store for components that want the runes-based API.
 */
export const tagStore = sharedTagStore;
