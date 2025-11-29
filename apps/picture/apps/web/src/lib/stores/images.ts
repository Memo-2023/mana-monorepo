import { writable } from 'svelte/store';
import type { Image } from '$lib/api/images';

export const images = writable<Image[]>([]);
export const selectedImage = writable<Image | null>(null);
export const isLoading = writable(false);
export const hasMore = writable(true);
export const currentPage = writable(1);
export const showFavoritesOnly = writable(false);
