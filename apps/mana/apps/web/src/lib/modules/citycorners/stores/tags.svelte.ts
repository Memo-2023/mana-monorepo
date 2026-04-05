/**
 * Ucitycorners Tags — Uses shared global tags + module-specific junction table.
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

export const locationTagOps = createTagLinkOps({
	table: () => db.table('ccLocationTags'),
	entityIdField: 'locationId',
});
