import { useEffect } from 'react';
import { useTagStore } from '~/store/tagStore';
import { usePagination } from '~/hooks/usePagination';
import { PAGINATION } from '~/constants';
import { ImageItem } from '~/types/gallery';
import { getImages } from '~/services/api/images';

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

      // Fetch archived images from backend API
      const imageData = await getImages({
        page: pageNum + 1, // API uses 1-based pagination
        limit: PAGINATION.GALLERY_PAGE_SIZE,
        archived: true,
      });

      // Check if there are more images
      pagination.setHasMore(imageData.length >= PAGINATION.GALLERY_PAGE_SIZE);

      // Load all tags in parallel
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
