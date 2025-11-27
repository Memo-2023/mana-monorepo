import { useState, useCallback } from 'react';

type UsePaginationOptions = {
	pageSize: number;
	initialPage?: number;
};

type UsePaginationReturn<T> = {
	items: T[];
	page: number;
	hasMore: boolean;
	loading: boolean;
	loadingMore: boolean;
	refreshing: boolean;
	setItems: (items: T[] | ((prev: T[]) => T[])) => void;
	appendItems: (newItems: T[]) => void;
	setHasMore: (hasMore: boolean) => void;
	setLoading: (loading: boolean) => void;
	setLoadingMore: (loading: boolean) => void;
	setRefreshing: (refreshing: boolean) => void;
	nextPage: () => void;
	resetPage: () => void;
	reset: () => void;
};

export function usePagination<T>({
	pageSize,
	initialPage = 0,
}: UsePaginationOptions): UsePaginationReturn<T> {
	const [items, setItems] = useState<T[]>([]);
	const [page, setPage] = useState(initialPage);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const appendItems = useCallback(
		(newItems: T[]) => {
			setItems((prev) => [...prev, ...newItems]);
			// Check if we have more items to load
			if (newItems.length < pageSize) {
				setHasMore(false);
			}
		},
		[pageSize]
	);

	const nextPage = useCallback(() => {
		setPage((prev) => prev + 1);
	}, []);

	const resetPage = useCallback(() => {
		setPage(initialPage);
	}, [initialPage]);

	const reset = useCallback(() => {
		setItems([]);
		setPage(initialPage);
		setHasMore(true);
		setLoading(true);
		setLoadingMore(false);
		setRefreshing(false);
	}, [initialPage]);

	return {
		items,
		page,
		hasMore,
		loading,
		loadingMore,
		refreshing,
		setItems,
		appendItems,
		setHasMore,
		setLoading,
		setLoadingMore,
		setRefreshing,
		nextPage,
		resetPage,
		reset,
	};
}
