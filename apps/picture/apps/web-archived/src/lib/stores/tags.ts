/**
 * Tag Store — Local-First via Shared Tag Store
 */
export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
} from '@manacore/shared-stores';

import { writable } from 'svelte/store';

/** UI-only: currently selected tag IDs for filtering (not persisted) */
export const selectedTags = writable<string[]>([]);
