import { writable } from 'svelte/store';
import type { Image } from '$lib/api/images';

/**
 * UI-only state for gallery image selection and filter toggles.
 * Data reads are handled by useLiveQuery hooks in queries.ts.
 */

export const selectedImage = writable<Image | null>(null);
export const showFavoritesOnly = writable(false);
