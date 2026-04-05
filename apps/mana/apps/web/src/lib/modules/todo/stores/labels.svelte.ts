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
	table: () => db.table('taskLabels'), // DB table still 'taskLabels' until schema migration
	entityIdField: 'taskId',
});

// Backward-compat alias
export const labelsStore = {
	createLabel: async (data: { name: string; color: string }) => {
		const { tagMutations } = await import('@mana/shared-stores');
		return tagMutations.createTag({ name: data.name, color: data.color });
	},
	updateLabel: async (id: string, data: { name?: string; color?: string }) => {
		const { tagMutations } = await import('@mana/shared-stores');
		return tagMutations.updateTag(id, data);
	},
	deleteLabel: async (id: string) => {
		const { tagMutations } = await import('@mana/shared-stores');
		return tagMutations.deleteTag(id);
	},
};
