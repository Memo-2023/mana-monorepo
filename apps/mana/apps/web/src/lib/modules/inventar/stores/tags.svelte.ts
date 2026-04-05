/**
 * Uinventar Tags — Uses shared global tags + module-specific junction table.
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

export const itemTagOps = createTagLinkOps({
	table: () => db.table('invItemTags'),
	entityIdField: 'itemId',
});
