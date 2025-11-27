import { router } from 'expo-router';
import { ExploreImageItem } from '~/types/explore';
import { likeImage, unlikeImage } from '~/services/api/images';

type UseImageLikesProps = {
  userId: string | undefined;
  items: ExploreImageItem[];
  setItems: (items: ExploreImageItem[]) => void;
  onError?: (error: Error) => void;
};

export function useImageLikes({ userId, items, setItems, onError }: UseImageLikesProps) {
  const toggleLike = async (imageId: string, userHasLiked: boolean) => {
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const result = userHasLiked
        ? await unlikeImage(imageId)
        : await likeImage(imageId);

      // Update local state with API response
      setItems(items.map(img =>
        img.id === imageId
          ? {
              ...img,
              userHasLiked: result.liked,
              likesCount: result.likeCount,
            }
          : img
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      onError?.(error as Error);
    }
  };

  return {
    toggleLike,
  };
}
