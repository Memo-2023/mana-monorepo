import { useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ImageItem } from '~/types/gallery';

type UseArchiveFetchingProps = {
  userId: string | undefined;
  onError?: (error: Error) => void;
};

export function useArchiveFetching({ userId, onError }: UseArchiveFetchingProps) {
  const pagination = usePagination<ImageItem>({
    pageSize: PAGINATION.GALLERY_PAGE_SIZE,
  });

  const { fetchImageTags, getImageTags } = useTagStore();

  const fetchArchivedImages = async (pageNum = 0, append = false) => {
    if (!userId) return;

    try {
      // Set appropriate loading state
      if (!append && pageNum === 0) {
        if (pagination.items.length === 0) {
          pagination.setLoading(true);
        }
      } else if (append) {
        pagination.setLoadingMore(true);
      }

      // Query only archived images (archived_at IS NOT NULL)
      let query = supabase
        .from('images')
        .select('id, public_url, prompt, created_at, is_favorite, model, blurhash, archived_at')
        .eq('user_id', userId)
        .not('archived_at', 'is', null); // Only archived images

      // Apply pagination
      const from = pageNum * PAGINATION.GALLERY_PAGE_SIZE;
      const to = from + PAGINATION.GALLERY_PAGE_SIZE - 1;

      const { data, error } = await query
        .order('archived_at', { ascending: false }) // Sort by archive date (newest first)
        .range(from, to);

      if (error) throw error;

      // Fetch tags for all images - PARALLEL for performance
      const imageData = data || [];

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.GALLERY_PAGE_SIZE);

      // Load all tags in parallel
      await Promise.all(
        imageData.map(image => fetchImageTags(image.id))
      );

      // Add tags to images
      const imagesWithTags = imageData.map(img => ({
        ...img,
        tags: getImageTags(img.id)
      }));

      // Either replace or append images
      if (append) {
        pagination.appendItems(imagesWithTags);
      } else {
        pagination.setItems(imagesWithTags);
        pagination.resetPage();
      }
    } catch (error) {
      console.error('Error fetching archived images:', error);
      onError?.(error as Error);
    } finally {
      pagination.setLoading(false);
      pagination.setRefreshing(false);
      pagination.setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!pagination.hasMore || pagination.loadingMore || pagination.loading) return;

    pagination.nextPage();
    fetchArchivedImages(pagination.page + 1, true);
  };

  const onRefresh = () => {
    pagination.setRefreshing(true);
    pagination.resetPage();
    pagination.setHasMore(true);
    fetchArchivedImages(0, false);
  };

  // Initial fetch
  useEffect(() => {
    fetchArchivedImages(0, false);
  }, [userId]);

  return {
    pagination,
    fetchArchivedImages,
    loadMore,
    onRefresh,
  };
}
