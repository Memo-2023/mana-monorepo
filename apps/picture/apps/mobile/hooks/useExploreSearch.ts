import { useMemo } from 'react';
import { ExploreImageItem } from '~/types/explore';

type UseExploreSearchProps = {
	items: ExploreImageItem[];
	searchQuery: string;
	selectedTags: string[];
};

export function useExploreSearch({ items, searchQuery, selectedTags }: UseExploreSearchProps) {
	const filteredImages = useMemo(() => {
		let filtered = items;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(image) =>
					image.prompt.toLowerCase().includes(query) ||
					image.tags?.some((tag) => tag.name.toLowerCase().includes(query)) ||
					image.creator?.username?.toLowerCase().includes(query)
			);
		}

		// Apply tag filter
		if (selectedTags.length > 0) {
			filtered = filtered.filter((image) => {
				const imageTags = image.tags || [];
				return selectedTags.some((selectedTagId) =>
					imageTags.some((tag) => tag.id === selectedTagId)
				);
			});
		}

		return filtered;
	}, [items, selectedTags, searchQuery]);

	return {
		filteredImages,
	};
}
