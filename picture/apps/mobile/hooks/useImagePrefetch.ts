import { useEffect } from 'react';
import { Image } from 'expo-image';
import { supabase } from '~/utils/supabase';
import { PAGINATION } from '~/constants';
import { FilterMode, ViewMode } from '~/types/gallery';
import { getThumbnailUrl, getSizeForViewMode } from '~/utils/image';
import { PREFETCH_DEBOUNCE_MS } from '~/constants/gallery';

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

        // Calculate what the next page would be
        const nextPageNum = currentPage + 1;

        let query = supabase
          .from('images')
          .select('id, public_url')
          .eq('user_id', userId);

        if (filterMode === 'favorites') {
          query = query.eq('is_favorite', true);
        }

        const from = nextPageNum * PAGINATION.GALLERY_PAGE_SIZE;
        const to = from + prefetchCount - 1;

        const { data } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (data && data.length > 0) {
          // Prefetch thumbnails for next page
          const thumbnailSize = getSizeForViewMode(viewMode);
          data.forEach(img => {
            if (img.public_url) {
              const thumbnailUrl = getThumbnailUrl(img.public_url, thumbnailSize);
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
