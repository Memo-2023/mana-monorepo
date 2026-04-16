/**
 * Todo Tags — Uses shared global tags via taskLabels junction table.
 * Note: the junction uses 'labelId' (not 'tagId') for historical reasons.
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

export const taskLabelOps = createTagLinkOps({
	table: () => db.table('taskLabels'),
	entityIdField: 'taskId',
});
