/**
 * Memoro module — barrel exports.
 */

export { memosStore } from './stores/memos.svelte';
export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
	memoTagOps,
} from './stores/tags.svelte';
export { memoriesStore } from './stores/memories.svelte';
export {
	useAllMemos,
	useArchivedMemos,
	useMemoriesByMemo,
	useAllMemoTags,
	useAllSpaces,
	toMemo,
	toMemory,
	toSpace,
	sortMemos,
	filterBySearch,
	filterByTag,
	getTagsForMemo,
	formatDuration,
	getStatusLabel,
} from './queries';
export {
	memoTable,
	memoryTable,
	memoTagTable,
	memoroSpaceTable,
	spaceMemberTable,
	memoSpaceTable,
	MEMORO_GUEST_SEED,
} from './collections';
export type {
	LocalMemo,
	LocalMemory,
	LocalMemoTag,
	LocalSpace,
	LocalSpaceMember,
	LocalMemoSpace,
	Memo,
	Memory,
	Space,
	ProcessingStatus,
} from './types';
// Tag type re-exported from @mana/shared-tags (the local memoro Tag was removed)
export type { Tag } from '@mana/shared-tags';
