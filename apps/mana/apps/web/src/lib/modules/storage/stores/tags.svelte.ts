/**
 * Storage Tags — Uses shared global tags + module-specific junction table.
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

export const fileTagOps = createTagLinkOps({
	table: () => db.table('fileTags'),
	entityIdField: 'fileId',
});
