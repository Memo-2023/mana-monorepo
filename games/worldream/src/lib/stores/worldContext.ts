import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ContentNode } from '$lib/types/content';

// Store for the current world context
function createWorldStore() {
	const STORAGE_KEY = 'worldream-current-world';

	// Initialize from localStorage if available
	const initialWorld =
		browser && localStorage.getItem(STORAGE_KEY)
			? JSON.parse(localStorage.getItem(STORAGE_KEY)!)
			: null;

	const { subscribe, set, update } = writable<ContentNode | null>(initialWorld);

	return {
		subscribe,

		// Set the current world
		setWorld(world: ContentNode) {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
			}
			set(world);
		},

		// Clear the current world
		clearWorld() {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(null);
		},

		// Get the current world (for non-reactive access)
		getCurrent() {
			return get({ subscribe });
		},
	};
}

export const currentWorld = createWorldStore();

// Derived store for world slug
export const currentWorldSlug = derived(currentWorld, ($world) => $world?.slug || null);

// Derived store for checking if we're in a world context
export const hasWorldContext = derived(currentWorld, ($world) => $world !== null);
