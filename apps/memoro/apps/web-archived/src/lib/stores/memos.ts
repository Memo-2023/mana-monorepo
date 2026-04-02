import { writable, derived, get } from 'svelte/store';
import type { Memo } from '$lib/types/memo.types';

function createMemoStore() {
	const { subscribe, set, update } = writable<Memo[]>([]);

	return {
		subscribe,
		setMemos: (memos: Memo[]) => set(memos),
		appendMemos: (newMemos: Memo[]) =>
			update((memos) => {
				// Avoid duplicates
				const existingIds = new Set(memos.map((m) => m.id));
				const uniqueNewMemos = newMemos.filter((m) => !existingIds.has(m.id));
				return [...memos, ...uniqueNewMemos];
			}),
		addMemo: (memo: Memo) =>
			update((memos) => {
				// Avoid duplicates when adding single memo
				if (memos.some((m) => m.id === memo.id)) return memos;
				return [memo, ...memos];
			}),
		updateMemo: (id: string, updates: Partial<Memo>) =>
			update((memos) => memos.map((m) => (m.id === id ? { ...m, ...updates } : m))),
		deleteMemo: (id: string) => update((memos) => memos.filter((m) => m.id !== id)),
		reset: () => set([]),
		getCount: () => get({ subscribe }).length,
	};
}

export const memos = createMemoStore();

// Pagination state
export const hasMoreMemos = writable(false);
export const isLoadingMore = writable(false);
export const currentOffset = writable(0);

// Derived store for search/filter
export const searchQuery = writable('');
export const selectedTagId = writable<string | null>(null);

// Debounced search query for actual filtering
export const debouncedSearchQuery = writable('');
let debounceTimer: ReturnType<typeof setTimeout>;

// Set up debounce for search
searchQuery.subscribe((value) => {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debouncedSearchQuery.set(value);
	}, 300);
});

// Cache for pre-computed lowercase values to avoid repeated toLowercase calls
let memoSearchCache = new Map<string, { title: string; transcript: string }>();
let lastMemoIds: string[] = [];

function updateSearchCache(memos: Memo[]) {
	const currentIds = memos.map((m) => m.id);

	// Only rebuild if memos changed
	if (
		lastMemoIds.length === currentIds.length &&
		lastMemoIds.every((id, i) => id === currentIds[i])
	) {
		return;
	}

	lastMemoIds = currentIds;
	memoSearchCache = new Map();

	for (const memo of memos) {
		memoSearchCache.set(memo.id, {
			title: (memo.title || '').toLowerCase(),
			transcript: (memo.transcript || '').toLowerCase(),
		});
	}
}

export const filteredMemos = derived(
	[memos, debouncedSearchQuery, selectedTagId],
	([$memos, $debouncedSearchQuery, $selectedTagId]) => {
		// Update search cache if memos changed
		updateSearchCache($memos);

		// Early return if no filters
		if (!$debouncedSearchQuery && !$selectedTagId) {
			// Just sort by pinned and date
			return $memos.toSorted((a, b) => {
				if (a.is_pinned && !b.is_pinned) return -1;
				if (!a.is_pinned && b.is_pinned) return 1;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});
		}

		let filtered: Memo[];

		// Filter by search query using cached lowercase values
		if ($debouncedSearchQuery) {
			const query = $debouncedSearchQuery.toLowerCase();
			filtered = $memos.filter((memo) => {
				const cached = memoSearchCache.get(memo.id);
				if (!cached) return false;
				return cached.title.includes(query) || cached.transcript.includes(query);
			});
		} else {
			filtered = $memos;
		}

		// Filter by tag
		if ($selectedTagId) {
			filtered = filtered.filter((memo) => memo.tags?.some((tag) => tag.id === $selectedTagId));
		}

		// Sort: pinned memos first, then by created_at
		// Using toSorted() to avoid mutating the filtered array
		return filtered.toSorted((a, b) => {
			if (a.is_pinned && !b.is_pinned) return -1;
			if (!a.is_pinned && b.is_pinned) return 1;
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		});
	}
);
