/**
 * Tag Store — Local-First via Shared Tag Store
 * Tags are stored in shared IndexedDB ('manacore-tags'), accessible across all apps.
 * Use context ('tags') for reads, tagMutations for writes.
 */
export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
} from '@manacore/shared-stores';
