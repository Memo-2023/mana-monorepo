/**
 * Music Tags — Uses shared global tags + module-specific junction table.
 */

import { db } from '$lib/data/database';
import { createTagLinkOps } from '@manacore/shared-stores';

export {
	tagMutations,
	useAllTags,
	getTagById,
	getTagsByIds,
	getTagColor,
} from '@manacore/shared-stores';

export const songTagOps = createTagLinkOps({
	table: () => db.table('songTags'),
	entityIdField: 'songId',
});
