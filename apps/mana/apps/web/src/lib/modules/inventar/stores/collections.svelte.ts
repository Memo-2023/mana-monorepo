/**
 * Collections Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { invCollectionTable } from '../collections';
import { toCollection } from '../queries';
import type { LocalCollection } from '../types';
import { InventarEvents } from '@mana/shared-utils/analytics';

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
		InventarEvents.collectionCreated();
		return toCollection(newLocal);
	},

	async update(
		id: string,
		data: Partial<Pick<LocalCollection, 'name' | 'description' | 'icon' | 'color' | 'schema'>>
	) {
		await invCollectionTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string) {
		await invCollectionTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		InventarEvents.collectionDeleted();
	},

	async reorder(orderedIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < orderedIds.length; i++) {
			await invCollectionTable.update(orderedIds[i], { order: i, updatedAt: now });
		}
	},

	async updateItemCount(collectionId: string, count: number) {
		await invCollectionTable.update(collectionId, {
			itemCount: count,
			updatedAt: new Date().toISOString(),
		});
	},
};
