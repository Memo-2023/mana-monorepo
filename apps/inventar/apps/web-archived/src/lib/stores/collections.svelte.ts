/**
 * Collections Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB via local-store.
 */

import type { CollectionSchema } from '@inventar/shared';
import { collectionCollection, type LocalCollection } from '$lib/data/local-store';
import { toCollection } from '$lib/data/queries';

export const collectionsStore = {
	async create(data: {
		name: string;
		description?: string;
		icon?: string;
		color?: string;
		schema: CollectionSchema;
		templateId?: string;
	}) {
		const all = await collectionCollection.getAll();
		const newLocal: LocalCollection = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description ?? null,
			icon: data.icon ?? null,
			color: data.color ?? null,
			schema: data.schema,
			templateId: data.templateId ?? null,
			order: all.length,
			itemCount: 0,
		};
		const inserted = await collectionCollection.insert(newLocal);
		return toCollection(inserted);
	},

	async update(
		id: string,
		data: Partial<Pick<LocalCollection, 'name' | 'description' | 'icon' | 'color' | 'schema'>>
	) {
		await collectionCollection.update(id, data);
	},

	async delete(id: string) {
		await collectionCollection.delete(id);
	},

	async reorder(orderedIds: string[]) {
		for (let i = 0; i < orderedIds.length; i++) {
			await collectionCollection.update(orderedIds[i], { order: i });
		}
	},

	async updateItemCount(collectionId: string, count: number) {
		await collectionCollection.update(collectionId, { itemCount: count });
	},
};
