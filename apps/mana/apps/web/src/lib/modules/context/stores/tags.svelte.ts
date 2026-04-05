/**
 * Ucontext Tags — Uses shared global tags + module-specific junction table.
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

export const documentTagOps = createTagLinkOps({
	table: () => db.table('documentTags'),
	entityIdField: 'documentId',
});
