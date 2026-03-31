import React, { useMemo } from 'react';
import SearchBar from '~/components/molecules/SearchBar';
import { useBottomBar } from '~/features/bottomBar';
import { useGlobalSearchStore } from '../store/globalSearchStore';

/**
 * Global search overlay that registers as a BottomBar when active.
 * Mount once in the protected layout. Reads search state from the global store.
 */
export default function GlobalSearchOverlay() {
	const isActive = useGlobalSearchStore((s) => s.isActive);
	const provider = useGlobalSearchStore((s) => s.provider);
	const closeSearch = useGlobalSearchStore((s) => s.closeSearch);

	const searchBarContent = useMemo(() => {
		if (!provider) return null;
		return (
			<SearchBar
				onSearch={provider.onSearch}
				onClose={closeSearch}
				placeholder={provider.placeholder}
				autoFocus={true}
				currentIndex={provider.currentIndex}
				totalResults={provider.totalResults}
				onNext={provider.onNext}
				onPrevious={provider.onPrevious}
				onChange={provider.onSearch}
			/>
		);
	}, [provider, closeSearch]);

	useBottomBar(
		isActive && provider
			? {
					id: 'global-search',
					priority: 60,
					collapsedIcon: 'search-outline',
					collapsible: false,
					content: searchBarContent,
					keyboardBehavior: 'dodge',
				}
			: null
	);

	return null;
}
