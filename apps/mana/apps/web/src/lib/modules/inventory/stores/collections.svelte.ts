/**
 * Collections Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { invCollectionTable } from '../collections';
import { toCollection } from '../queries';
import type { LocalCollection } from '../types';
import { InventoryEvents } from '@mana/shared-utils/analytics';

export const collectionsStore = {
	async create(data: {
		name: string;
		description?: string;
		icon?: string;
		color?: string;
		schema: LocalCollection['schema'];
		templateId?: string;
	}) {
		const all = await invCollectionTable.toArray();
		const active = all.filter((c) => !c.deletedAt);
		const newLocal: LocalCollection = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description ?? null,
			icon: data.icon ?? null,
			color: data.color ?? null,
			schema: data.schema,
			templateId: data.templateId ?? null,
			order: active.length,
			itemCount: 0,
		};
		await invCollectionTable.add(newLocal);
		InventoryEvents.collectionCreated();
		return toCollection(newLocal);
	},

	async update(
		id: string,
		data: Partial<Pick<LocalCollection, 'name' | 'description' | 'icon' | 'color' | 'schema'>>
	) {
		await invCollectionTable.update(id, {
			...data,
		});
	},

	async delete(id: string) {
		await invCollectionTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		InventoryEvents.collectionDeleted();
	},

	async reorder(orderedIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < orderedIds.length; i++) {
			await invCollectionTable.update(orderedIds[i], { order: i });
		}
	},

	async updateItemCount(collectionId: string, count: number) {
		await invCollectionTable.update(collectionId, {
			itemCount: count,
		});
	},
};
