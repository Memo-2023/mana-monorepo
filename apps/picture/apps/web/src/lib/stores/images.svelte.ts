/**
 * Images Store - Svelte 5 Runes Version
 */

import type { Image } from '$lib/api/images';

// State using Svelte 5 runes
let images = $state<Image[]>([]);
let selectedImage = $state<Image | null>(null);
let isLoading = $state(false);
let hasMore = $state(true);
let currentPage = $state(1);
let showFavoritesOnly = $state(false);

export const imagesStore = {
	get images() {
		return images;
	},
	get selectedImage() {
		return selectedImage;
	},
	get isLoading() {
		return isLoading;
	},
	get hasMore() {
		return hasMore;
	},
	get currentPage() {
		return currentPage;
	},
	get showFavoritesOnly() {
		return showFavoritesOnly;
	},

	setImages(newImages: Image[]) {
		images = newImages;
	},

	appendImages(newImages: Image[]) {
		images = [...images, ...newImages];
	},

	addImage(image: Image) {
		images = [image, ...images];
	},

	updateImage(id: string, updates: Partial<Image>) {
		images = images.map((img) => (img.id === id ? { ...img, ...updates } : img));
	},

	removeImage(id: string) {
		images = images.filter((img) => img.id !== id);
		if (selectedImage?.id === id) {
			selectedImage = null;
		}
	},

	selectImage(image: Image | null) {
		selectedImage = image;
	},

	setLoading(loading: boolean) {
		isLoading = loading;
	},

	setHasMore(more: boolean) {
		hasMore = more;
	},

	setCurrentPage(page: number) {
		currentPage = page;
	},

	incrementPage() {
		currentPage++;
	},

	setShowFavoritesOnly(favoritesOnly: boolean) {
		showFavoritesOnly = favoritesOnly;
	},

	reset() {
		images = [];
		selectedImage = null;
		isLoading = false;
		hasMore = true;
		currentPage = 1;
	},
};

// Export individual getters for backwards compatibility
export function getImages() {
	return images;
}

export function getSelectedImage() {
	return selectedImage;
}

export function getIsLoading() {
	return isLoading;
}
