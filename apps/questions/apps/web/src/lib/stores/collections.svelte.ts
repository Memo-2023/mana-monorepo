/**
 * Collections Store — Mutation-Only
 *
 * All reads are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store only exposes mutations that write to IndexedDB.
 * The live queries will automatically pick up the changes.
 */

import { collectionCollection, type LocalCollection } from '$lib/data/local-store';
import { toCollection } from '$lib/data/queries';
import { QuestionsEvents } from '@manacore/shared-utils/analytics';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '$lib/types';

let loading = $state(false);
let error = $state<string | null>(null);
let selectedId = $state<string | null>(null);

export const collectionsStore = {
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedId() {
		return selectedId;
	},

	/**
	 * Create a new collection — writes to IndexedDB instantly.
	 */
	async create(data: CreateCollectionDto): Promise<Collection | null> {
		loading = true;
		error = null;

		try {
			const newLocal: LocalCollection = {
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description ?? null,
				color: data.color || '#6366f1',
				icon: data.icon || 'folder',
				isDefault: data.isDefault || false,
				sortOrder: Date.now(),
			};

			const inserted = await collectionCollection.insert(newLocal);
			QuestionsEvents.collectionCreated();
			return toCollection(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create collection';
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update a collection — writes to IndexedDB instantly.
	 */
	async update(id: string, data: UpdateCollectionDto): Promise<Collection | null> {
		error = null;

		try {
			const updateData: Partial<LocalCollection> = {};
			if (data.name !== undefined) updateData.name = data.name;
			if (data.description !== undefined) updateData.description = data.description ?? null;
			if (data.color !== undefined) updateData.color = data.color;
			if (data.icon !== undefined) updateData.icon = data.icon;
			if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

			const updated = await collectionCollection.update(id, updateData);
			if (updated) return toCollection(updated);
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update collection';
			return null;
		}
	},

	/**
	 * Delete a collection — removes from IndexedDB instantly.
	 */
	async delete(id: string): Promise<boolean> {
		error = null;

		try {
			await collectionCollection.delete(id);
			QuestionsEvents.collectionDeleted();
			if (selectedId === id) {
				selectedId = null;
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete collection';
			return false;
		}
	},

	/**
	 * Reorder collections — updates sortOrder in IndexedDB.
	 */
	async reorder(orderedIds: string[]): Promise<boolean> {
		error = null;

		try {
			for (let i = 0; i < orderedIds.length; i++) {
				await collectionCollection.update(orderedIds[i], { sortOrder: i });
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder collections';
			return false;
		}
	},

	select(id: string | null) {
		selectedId = id;
	},

	/**
	 * No longer relevant — all collections are local and editable.
	 */
	isDemoCollection(_id: string): boolean {
		return false;
	},

	clear() {
		error = null;
		selectedId = null;
	},
};
