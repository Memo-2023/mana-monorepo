/**
 * Articles Tags — junction ops into the global tag system.
 *
 * Mirrors notes/stores/tags.svelte.ts, calendar/stores/tags.svelte.ts,
 * contacts/stores/tags.svelte.ts — tag names/colors live in globalTags
 * (appId: 'tags'), articles just holds the junction rows.
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

export const articleTagOps = createTagLinkOps({
	table: () => db.table('articleTags'),
	entityIdField: 'articleId',
});
