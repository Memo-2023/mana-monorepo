/**
 * Categories Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB via local-store.
 */

import { categoryCollection, type LocalCategory } from '$lib/data/local-store';
import { toCategory } from '$lib/data/queries';

export const categoriesStore = {
	async create(data: { name: string; icon?: string; color?: string; parentId?: string }) {
		const all = await categoryCollection.getAll();
		const siblings = all.filter((c) => c.parentId === data.parentId);

		const newLocal: LocalCategory = {
			id: crypto.randomUUID(),
			parentId: data.parentId ?? null,
			name: data.name,
			icon: data.icon ?? null,
			color: data.color ?? null,
			order: siblings.length,
		};
		const inserted = await categoryCollection.insert(newLocal);
		return toCategory(inserted);
	},

	async update(id: string, data: Partial<Pick<LocalCategory, 'name' | 'icon' | 'color'>>) {
		await categoryCollection.update(id, data);
	},

	async delete(id: string) {
		const all = await categoryCollection.getAll();
		const idsToDelete = new Set<string>();
		const collectIds = (parentId: string) => {
			idsToDelete.add(parentId);
			all.filter((c) => c.parentId === parentId).forEach((c) => collectIds(c.id));
		};
		collectIds(id);
		for (const deleteId of idsToDelete) {
			await categoryCollection.delete(deleteId);
		}
	},
};
