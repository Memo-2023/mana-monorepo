import { useEffect } from 'react';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ImageItem, FilterMode } from '~/types/gallery';
import { getImages, toggleFavorite as apiToggleFavorite } from '~/services/api/images';

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

      console.log('🔍 Fetching images via API...');

      // Fetch images from backend API
      const imageData = await getImages({
        page: pageNum + 1, // API uses 1-based pagination
        limit: PAGINATION.GALLERY_PAGE_SIZE,
        archived: false,
        favoritesOnly: filterMode === 'favorites',
      });

      console.log('✅ Images fetched:', imageData.length, 'images');

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.GALLERY_PAGE_SIZE);

      // Load all tags in parallel instead of sequential
      await Promise.all(
        imageData.map(image => fetchImageTags(image.id))
      );

      // Map API response to ImageItem format and add tags
      const imagesWithTags: ImageItem[] = imageData.map(img => ({
        id: img.id,
        publicUrl: img.publicUrl || null,
        prompt: img.prompt,
        createdAt: img.createdAt,
        isFavorite: img.isFavorite,
        model: img.model,
        blurhash: img.blurhash,
        tags: getImageTags(img.id),
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
      await apiToggleFavorite(imageId, !currentStatus);
      // Update local state
      pagination.setItems(pagination.items.map(img =>
        img.id === imageId ? { ...img, isFavorite: !currentStatus } : img
      ));
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
