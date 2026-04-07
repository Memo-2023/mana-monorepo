/**
 * Todo Tags (formerly Labels) — Uses shared global tags + module-specific junction table.
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

export const taskTagOps = createTagLinkOps({
	table: () => db.table('taskLabels'),
	entityIdField: 'taskId',
});
