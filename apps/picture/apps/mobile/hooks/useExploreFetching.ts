import { useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ExploreImageItem, SortMode } from '~/types/explore';

type UseExploreFetchingProps = {
  userId: string | undefined;
  sortMode: SortMode;
  onError?: (error: Error) => void;
};

export function useExploreFetching({ userId, sortMode, onError }: UseExploreFetchingProps) {
  const pagination = usePagination<ExploreImageItem>({
    pageSize: PAGINATION.EXPLORE_PAGE_SIZE,
  });

  const { fetchTags, fetchImageTags, getImageTags } = useTagStore();

  const fetchPublicImages = async (pageNum = 0, append = false) => {
    try {
      // Set appropriate loading state
      if (!append && pageNum === 0) {
        if (pagination.items.length === 0) {
          pagination.setLoading(true);
        }
      } else if (append) {
        pagination.setLoadingMore(true);
      }

      // Fetch public images with creator info
      let query = supabase
        .from('images')
        .select(`
          id,
          public_url,
          prompt,
          created_at,
          is_favorite,
          user_id,
          model,
          blurhash,
          profiles!images_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true);

      // Apply sorting
      switch (sortMode) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('created_at', { ascending: false });
          break;
        case 'trending':
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      const from = pageNum * PAGINATION.EXPLORE_PAGE_SIZE;
      const to = from + PAGINATION.EXPLORE_PAGE_SIZE - 1;

      const { data, error } = await query.range(from, to);

      if (error) throw error;

      // Fetch tags and likes for all images
      const imageData = data || [];

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.EXPLORE_PAGE_SIZE);

      // Batch fetch all tags in parallel
      await Promise.all(imageData.map(img => fetchImageTags(img.id)));

      // Batch fetch all likes in ONE query
      const imageIds = imageData.map(img => img.id);
      const [likesCountData, userLikesData] = await Promise.all([
        // Get counts for all images at once
        supabase
          .from('image_likes')
          .select('image_id')
          .in('image_id', imageIds),
        // Get user's likes for all images at once (only if logged in)
        userId ? supabase
          .from('image_likes')
          .select('image_id')
          .in('image_id', imageIds)
          .eq('user_id', userId) : Promise.resolve({ data: [] })
      ]);

      // Create lookup maps for O(1) access
      const likesCountMap = new Map<string, number>();
      likesCountData.data?.forEach(like => {
        likesCountMap.set(like.image_id, (likesCountMap.get(like.image_id) || 0) + 1);
      });

      const userLikesSet = new Set(userLikesData.data?.map(like => like.image_id) || []);

      // Combine all data
      const enhancedImages = imageData.map(img => ({
        ...img,
        tags: getImageTags(img.id),
        creator: img.profiles,
        likes_count: likesCountMap.get(img.id) || 0,
        user_has_liked: userLikesSet.has(img.id)
      }));

      // Sort by likes if popular mode (only for current batch)
      let finalImages = enhancedImages;
      if (sortMode === 'popular') {
        finalImages = [...enhancedImages].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      // Either replace or append images
      if (append) {
        pagination.appendItems(finalImages);
      } else {
        pagination.setItems(finalImages);
        pagination.resetPage();
      }
    } catch (error) {
      console.error('Error fetching public images:', error);
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
    fetchPublicImages(pagination.page + 1, true);
  };

  const onRefresh = () => {
    pagination.setRefreshing(true);
    pagination.resetPage();
    pagination.setHasMore(true);
    fetchPublicImages(0, false);
  };

  // Initial fetch
  useEffect(() => {
    fetchTags();
    pagination.resetPage();
    pagination.setHasMore(true);
    fetchPublicImages(0, false);
  }, [sortMode, userId]);

  return {
    pagination,
    fetchPublicImages,
    loadMore,
    onRefresh,
  };
}
