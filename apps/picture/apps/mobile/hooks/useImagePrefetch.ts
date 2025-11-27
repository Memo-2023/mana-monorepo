import { useEffect } from 'react';
import { Image } from 'expo-image';
import { PAGINATION } from '~/constants';
import { FilterMode, ViewMode } from '~/types/gallery';
import { getThumbnailUrl, getSizeForViewMode } from '~/utils/image';
import { PREFETCH_DEBOUNCE_MS } from '~/constants/gallery';
import { getImages } from '~/services/api/images';

type UseImagePrefetchProps = {
	hasMore: boolean;
	loading: boolean;
	loadingMore: boolean;
	itemsLength: number;
	currentPage: number;
	viewMode: ViewMode;
	userId: string | undefined;
	filterMode: FilterMode;
};

export function useImagePrefetch({
	hasMore,
	loading,
	loadingMore,
	itemsLength,
	currentPage,
	viewMode,
	userId,
	filterMode,
}: UseImagePrefetchProps) {
	useEffect(() => {
		if (!hasMore || loading || loadingMore || !userId) return;

		// Prefetch when we have items and aren't at the end
		const shouldPrefetch = itemsLength > 0 && hasMore;

		if (!shouldPrefetch) return;

		// Prefetch those images in the background
		const prefetchNextPage = async () => {
			try {
				// Get the last few images that would be from the next page
				const prefetchCount = Math.min(6, PAGINATION.GALLERY_PAGE_SIZE);

				// Calculate what the next page would be (API uses 1-based pagination)
				const nextPageNum = currentPage + 2;

				const data = await getImages({
					page: nextPageNum,
					limit: prefetchCount,
					archived: false,
					favoritesOnly: filterMode === 'favorites',
				});

				if (data && data.length > 0) {
					// Prefetch thumbnails for next page
					const thumbnailSize = getSizeForViewMode(viewMode);
					data.forEach((img) => {
						if (img.publicUrl) {
							const thumbnailUrl = getThumbnailUrl(img.publicUrl, thumbnailSize);
							if (thumbnailUrl) {
								Image.prefetch(thumbnailUrl);
							}
						}
					});
				}
			} catch (error) {
				// Silent fail - prefetching is optional
				console.debug('Prefetch failed (non-critical):', error);
			}
		};

		// Debounce prefetching to avoid excessive requests
		const timeoutId = setTimeout(prefetchNextPage, PREFETCH_DEBOUNCE_MS);
		return () => clearTimeout(timeoutId);
	}, [itemsLength, hasMore, currentPage, viewMode, userId, filterMode, loading, loadingMore]);
}
