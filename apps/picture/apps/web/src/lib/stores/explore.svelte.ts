/**
 * Explore Store - Svelte 5 Runes Version
 */

import type { Image } from '$lib/api/images';

// State using Svelte 5 runes
let exploreImages = $state<Image[]>([]);
let isLoadingExplore = $state(false);
let hasMoreExplore = $state(true);
let currentExplorePage = $state(1);
let exploreSortBy = $state<'recent' | 'popular' | 'trending'>('recent');
let exploreSearchQuery = $state('');
let showExploreFavoritesOnly = $state(false);

export const exploreStore = {
	get images() {
		return exploreImages;
	},
	get isLoading() {
		return isLoadingExplore;
	},
	get hasMore() {
		return hasMoreExplore;
	},
	get currentPage() {
		return currentExplorePage;
	},
	get sortBy() {
		return exploreSortBy;
	},
	get searchQuery() {
		return exploreSearchQuery;
	},
	get showFavoritesOnly() {
		return showExploreFavoritesOnly;
	},

	setImages(images: Image[]) {
		exploreImages = images;
	},

	appendImages(images: Image[]) {
		exploreImages = [...exploreImages, ...images];
	},

	setLoading(loading: boolean) {
		isLoadingExplore = loading;
	},

	setHasMore(more: boolean) {
		hasMoreExplore = more;
	},

	setCurrentPage(page: number) {
		currentExplorePage = page;
	},

	incrementPage() {
		currentExplorePage++;
	},

	setSortBy(sort: 'recent' | 'popular' | 'trending') {
		exploreSortBy = sort;
		// Reset when changing sort
		exploreImages = [];
		currentExplorePage = 1;
		hasMoreExplore = true;
	},

	setSearchQuery(query: string) {
		exploreSearchQuery = query;
		// Reset when changing search
		exploreImages = [];
		currentExplorePage = 1;
		hasMoreExplore = true;
	},

	setShowFavoritesOnly(favoritesOnly: boolean) {
		showExploreFavoritesOnly = favoritesOnly;
		// Reset when changing filter
		exploreImages = [];
		currentExplorePage = 1;
		hasMoreExplore = true;
	},

	reset() {
		exploreImages = [];
		isLoadingExplore = false;
		hasMoreExplore = true;
		currentExplorePage = 1;
		exploreSortBy = 'recent';
		exploreSearchQuery = '';
		showExploreFavoritesOnly = false;
	},
};

// Export individual getters for backwards compatibility
export function getExploreImages() {
	return exploreImages;
}

export function getExploreSortBy() {
	return exploreSortBy;
}
