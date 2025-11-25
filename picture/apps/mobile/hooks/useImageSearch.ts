import { useMemo } from 'react';
import { ImageItem } from '~/types/gallery';

type SearchableImage = ImageItem & {
  creator?: { username: string | null };
};

type UseImageSearchProps = {
  items: SearchableImage[];
  searchQuery: string;
  selectedTags: string[];
};

export function useImageSearch({ items, searchQuery, selectedTags }: UseImageSearchProps) {
  const filteredImages = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(image =>
        image.prompt.toLowerCase().includes(query) ||
        image.tags?.some(tag => tag.name.toLowerCase().includes(query)) ||
        image.model?.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(image => {
        const imageTags = image.tags || [];
        return selectedTags.some(selectedTagId =>
          imageTags.some(tag => tag.id === selectedTagId)
        );
      });
    }

    return filtered;
  }, [items, selectedTags, searchQuery]);

  return {
    filteredImages,
  };
}
