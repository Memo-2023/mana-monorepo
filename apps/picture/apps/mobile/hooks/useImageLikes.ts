import { supabase } from '~/utils/supabase';
import { router } from 'expo-router';
import { ExploreImageItem } from '~/types/explore';

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
      if (userHasLiked) {
        // Unlike
        await supabase
          .from('image_likes')
          .delete()
          .eq('image_id', imageId)
          .eq('user_id', userId);
      } else {
        // Like
        await supabase
          .from('image_likes')
          .insert({
            image_id: imageId,
            user_id: userId
          });
      }

      // Update local state
      setItems(items.map(img =>
        img.id === imageId
          ? {
              ...img,
              user_has_liked: !userHasLiked,
              likes_count: (img.likes_count || 0) + (userHasLiked ? -1 : 1)
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
