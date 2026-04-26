/**
 * Wish Lists Store — Mutations Only
 */

import { listTable } from '../collections';
import { toWishList } from '../queries';
import type { LocalWishList } from '../types';

export const listsStore = {
	async create(data: { name: string; description?: string; icon?: string; color?: string }) {
		const all = await listTable.toArray();
		const active = all.filter((l) => !l.deletedAt);

		const newLocal: LocalWishList = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description ?? null,
			icon: data.icon ?? null,
			color: data.color ?? null,
			isArchived: false,
			order: active.length,
		};
		await listTable.add(newLocal);
		return toWishList(newLocal);
	},

	async update(
		id: string,
		data: Partial<Pick<LocalWishList, 'name' | 'description' | 'icon' | 'color'>>
	) {
		await listTable.update(id, {
			...data,
		});
	},

	async archive(id: string) {
		await listTable.update(id, {
			isArchived: true,
		});
	},

	async delete(id: string) {
		await listTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	async reorder(orderedIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < orderedIds.length; i++) {
			await listTable.update(orderedIds[i], { order: i });
		}
	},
};
