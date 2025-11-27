import { useEffect } from 'react';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ExploreImageItem, SortMode } from '~/types/explore';
import { getExploreImages } from '~/services/api/explore';

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

      // Fetch public images from backend API
      const imageData = await getExploreImages({
        page: pageNum + 1, // API uses 1-based pagination
        limit: PAGINATION.EXPLORE_PAGE_SIZE,
        sortBy: sortMode,
      });

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.EXPLORE_PAGE_SIZE);

      // Batch fetch all tags in parallel
      await Promise.all(imageData.map(img => fetchImageTags(img.id)));

      // Map API response to ExploreImageItem format
      const enhancedImages: ExploreImageItem[] = imageData.map(img => ({
        id: img.id,
        publicUrl: img.publicUrl || null,
        prompt: img.prompt,
        createdAt: img.createdAt,
        isFavorite: img.isFavorite,
        userId: img.userId,
        model: img.model,
        blurhash: img.blurhash,
        tags: getImageTags(img.id),
        // TODO: Backend should return creator info and likes
        creator: undefined,
        likesCount: 0,
        userHasLiked: false,
      }));

      // Either replace or append images
      if (append) {
        pagination.appendItems(enhancedImages);
      } else {
        pagination.setItems(enhancedImages);
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
