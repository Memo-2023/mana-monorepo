/**
 * Categories Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { invCategoryTable } from '../collections';
import { toCategory } from '../queries';
import type { LocalCategory } from '../types';
import { InventarEvents } from '@manacore/shared-utils/analytics';

export const categoriesStore = {
	async create(data: { name: string; icon?: string; color?: string; parentId?: string }) {
		const all = await invCategoryTable.toArray();
		const active = all.filter((c) => !c.deletedAt);
		const siblings = active.filter((c) => c.parentId === data.parentId);

		const newLocal: LocalCategory = {
			id: crypto.randomUUID(),
			parentId: data.parentId ?? null,
			name: data.name,
			icon: data.icon ?? null,
			color: data.color ?? null,
			order: siblings.length,
		};
		await invCategoryTable.add(newLocal);
		InventarEvents.categoryCreated();
		return toCategory(newLocal);
	},

	async update(id: string, data: Partial<Pick<LocalCategory, 'name' | 'icon' | 'color'>>) {
		await invCategoryTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string) {
		const all = await invCategoryTable.toArray();
		const active = all.filter((c) => !c.deletedAt);
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			active.filter((c) => c.parentId === parentId).forEach((c) => collectIds(c.id));
		};
		collectIds(id);
		const now = new Date().toISOString();
		for (const deleteId of idsToDelete) {
			await invCategoryTable.update(deleteId, { deletedAt: now, updatedAt: now });
		}
		InventarEvents.categoryDeleted();
	},
};
