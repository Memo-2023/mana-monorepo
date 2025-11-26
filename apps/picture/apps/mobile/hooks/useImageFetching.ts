import { useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ImageItem, FilterMode } from '~/types/gallery';

type UseImageFetchingProps = {
  userId: string | undefined;
  filterMode: FilterMode;
  onError?: (error: Error) => void;
};

export function useImageFetching({ userId, filterMode, onError }: UseImageFetchingProps) {
  const pagination = usePagination<ImageItem>({
    pageSize: PAGINATION.GALLERY_PAGE_SIZE,
  });

  const { fetchTags, fetchImageTags, getImageTags } = useTagStore();

  const fetchImages = async (pageNum = 0, append = false) => {
    console.log('📸 fetchImages called:', { userId, pageNum, append });

    if (!userId) {
      // User not logged in - clear loading state and return
      console.log('❌ fetchImages: No userId, clearing loading state');
      pagination.setLoading(false);
      pagination.setRefreshing(false);
      pagination.setLoadingMore(false);
      return;
    }

    console.log('📸 Fetching images for user:', userId);

    try {
      // Set appropriate loading state
      if (!append && pageNum === 0) {
        if (pagination.items.length === 0) {
          console.log('📸 Setting loading state to true');
          pagination.setLoading(true);
        }
      } else if (append) {
        pagination.setLoadingMore(true);
      }

      console.log('🔍 Building Supabase query...');
      let query = supabase
        .from('images')
        .select('id, public_url, prompt, created_at, is_favorite, model, blurhash')
        .eq('user_id', userId)
        .is('archived_at', null); // Only show non-archived images

      // Apply favorite filter if needed
      if (filterMode === 'favorites') {
        console.log('🔍 Adding favorites filter');
        query = query.eq('is_favorite', true);
      }

      // Apply pagination
      const from = pageNum * PAGINATION.GALLERY_PAGE_SIZE;
      const to = from + PAGINATION.GALLERY_PAGE_SIZE - 1;
      console.log('🔍 Fetching range:', { from, to, pageSize: PAGINATION.GALLERY_PAGE_SIZE });

      console.log('⏳ Executing Supabase query...');

      // Add timeout to detect hanging queries
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      );

      const queryPromise = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error } = await Promise.race([queryPromise, timeout]) as any;

      console.log('✅ Supabase query completed');

      if (error) {
        console.error('❌ Error fetching images from Supabase:', error);
        throw error;
      }

      console.log('✅ Images fetched:', data?.length || 0, 'images');

      // Fetch tags for all images - PARALLEL for massive speed boost
      const imageData = data || [];

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.GALLERY_PAGE_SIZE);

      // Load all tags in parallel instead of sequential
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
      console.error('Error fetching images:', error);
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
    fetchImages(pagination.page + 1, true);
  };

  const onRefresh = () => {
    pagination.setRefreshing(true);
    pagination.resetPage();
    pagination.setHasMore(true);
    fetchImages(0, false);
  };

  const toggleFavorite = async (imageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({ is_favorite: !currentStatus })
        .eq('id', imageId);

      if (!error) {
        pagination.setItems(pagination.items.map(img =>
          img.id === imageId ? { ...img, is_favorite: !currentStatus } : img
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      onError?.(error as Error);
    }
  };

  // Initial fetch - only when userId is available
  useEffect(() => {
    console.log('📸 useImageFetching - Effect triggered:', {
      hasUserId: !!userId,
      userId,
      filterMode,
    });

    if (!userId) {
      console.log('⏸️ Skipping fetch - no userId yet');
      return;
    }

    console.log('▶️ Starting initial fetch');
    fetchTags();
    fetchImages(0, false);
  }, [userId, filterMode]);

  return {
    pagination,
    fetchImages,
    loadMore,
    onRefresh,
    toggleFavorite,
  };
}
