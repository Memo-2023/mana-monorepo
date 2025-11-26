import { useCallback, RefObject } from 'react';
import { FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ImageItem } from '~/types/gallery';
import { SCROLL_TO_INDEX_DELAY, CLEAR_LAST_VIEWED_DELAY } from '~/constants/gallery';

type UseScrollRestorationProps = {
  flatListRef: RefObject<FlatList>;
  lastViewedImageId: string | null;
  filteredImages: ImageItem[];
  onClearLastViewed: () => void;
};

export function useScrollRestoration({
  flatListRef,
  lastViewedImageId,
  filteredImages,
  onClearLastViewed,
}: UseScrollRestorationProps) {
  // Scroll to last viewed image when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!lastViewedImageId || filteredImages.length === 0) return;

      const index = filteredImages.findIndex(img => img.id === lastViewedImageId);
      if (index === -1 || !flatListRef.current) return;

      // Use scrollToIndex for grid layouts
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index,
            animated: false, // No animation for instant appearance
            viewPosition: 0.5, // Center the item
          });
        } catch (error) {
          // Fallback if scrollToIndex fails
          console.log('ScrollToIndex failed, trying offset method');
        }
      }, SCROLL_TO_INDEX_DELAY);

      // Clear the last viewed ID after scrolling
      setTimeout(() => {
        onClearLastViewed();
      }, CLEAR_LAST_VIEWED_DELAY);
    }, [lastViewedImageId, filteredImages, flatListRef, onClearLastViewed])
  );
}
