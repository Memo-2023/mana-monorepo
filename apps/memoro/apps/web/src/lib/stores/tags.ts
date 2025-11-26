import { writable, derived } from 'svelte/store';
import type { Tag } from '$lib/types/memo.types';

function createTagStore() {
	const { subscribe, set, update } = writable<Tag[]>([]);

	return {
		subscribe,
		setTags: (tags: Tag[]) => set(tags),
		addTag: (tag: Tag) => update((tags) => [...tags, tag].sort((a, b) => a.name.localeCompare(b.name))),
		updateTag: (id: string, updates: Partial<Tag>) =>
			update((tags) => tags.map((t) => (t.id === id ? { ...t, ...updates } : t))),
		deleteTag: (id: string) => update((tags) => tags.filter((t) => t.id !== id)),
		reset: () => set([])
	};
}

export const tags = createTagStore();

// Tag usage counts (for displaying how many memos use each tag)
export const tagUsageCounts = writable<Record<string, number>>({});
