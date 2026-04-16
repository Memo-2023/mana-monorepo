/**
 * Notes Tags — Uses shared global tags + module-specific junction table.
 * Mirrors the pattern in calendar/stores/tags.svelte.ts and
 * contacts/stores/tags.svelte.ts.
 */

import { db } from '$lib/data/database';
import { createTagLinkOps } from '@mana/shared-stores';

export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
} from '@mana/shared-stores';

export const noteTagOps = createTagLinkOps({
	table: () => db.table('noteTags'),
	entityIdField: 'noteId',
});
