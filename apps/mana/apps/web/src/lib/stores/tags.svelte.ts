/**
 * Tag Store - Re-exports shared local-first tag store
 *
 * Tags use the shared IndexedDB ('mana-tags') across all apps.
 * This module re-exports for backward compatibility with existing imports.
 */

export {
	tagLocalStore,
	tagMutations,
	tagCollection,
	tagGroupCollection,
	useAllTags,
	useAllTagGroups,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
} from '@mana/shared-stores';
