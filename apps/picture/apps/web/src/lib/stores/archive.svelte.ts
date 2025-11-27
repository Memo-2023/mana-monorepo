/**
 * Archive Store - Svelte 5 Runes Version
 */

import type { Image } from '$lib/api/images';

// State using Svelte 5 runes
let archivedImages = $state<Image[]>([]);
let isLoadingArchive = $state(false);
let hasMoreArchive = $state(true);
let currentArchivePage = $state(1);

export const archiveStore = {
	get images() {
		return archivedImages;
	},
	get isLoading() {
		return isLoadingArchive;
	},
	get hasMore() {
		return hasMoreArchive;
	},
	get currentPage() {
		return currentArchivePage;
	},

	setImages(images: Image[]) {
		archivedImages = images;
	},

	appendImages(images: Image[]) {
		archivedImages = [...archivedImages, ...images];
	},

	addImage(image: Image) {
		archivedImages = [image, ...archivedImages];
	},

	removeImage(id: string) {
		archivedImages = archivedImages.filter((img) => img.id !== id);
	},

	setLoading(loading: boolean) {
		isLoadingArchive = loading;
	},

	setHasMore(more: boolean) {
		hasMoreArchive = more;
	},

	setCurrentPage(page: number) {
		currentArchivePage = page;
	},

	incrementPage() {
		currentArchivePage++;
	},

	reset() {
		archivedImages = [];
		isLoadingArchive = false;
		hasMoreArchive = true;
		currentArchivePage = 1;
	},
};

// Export individual getters for backwards compatibility
export function getArchivedImages() {
	return archivedImages;
}
