import { writable } from 'svelte/store';
import type { Image } from '$lib/api/images';

export const exploreImages = writable<Image[]>([]);
export const isLoadingExplore = writable(false);
export const hasMoreExplore = writable(true);
export const currentExplorePage = writable(1);
export const exploreSortBy = writable<'recent' | 'popular' | 'trending'>('recent');
export const exploreSearchQuery = writable('');
export const showExploreFavoritesOnly = writable(false);
