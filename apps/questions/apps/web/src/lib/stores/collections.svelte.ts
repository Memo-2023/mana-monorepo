/**
 * Collections Store - Manages collections state using Svelte 5 runes
 */

import { collectionsApi } from '$lib/api/collections';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '$lib/types';

let collections = $state<Collection[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedId = $state<string | null>(null);

export const collectionsStore = {
	get collections() {
		return collections;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedId() {
		return selectedId;
	},
	get selected() {
		return selectedId ? collections.find((c) => c.id === selectedId) : null;
	},

	async load() {
		loading = true;
		error = null;

		try {
			collections = await collectionsApi.getAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load collections';
			collections = [];
		} finally {
			loading = false;
		}
	},

	async create(data: CreateCollectionDto): Promise<Collection | null> {
		loading = true;
		error = null;

		try {
			const collection = await collectionsApi.create(data);
			collections = [...collections, collection];
			return collection;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create collection';
			return null;
		} finally {
			loading = false;
		}
	},

	async update(id: string, data: UpdateCollectionDto): Promise<Collection | null> {
		error = null;

		try {
			const updated = await collectionsApi.update(id, data);
			collections = collections.map((c) => (c.id === id ? updated : c));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update collection';
			return null;
		}
	},

	async delete(id: string): Promise<boolean> {
		error = null;

		try {
			await collectionsApi.delete(id);
			collections = collections.filter((c) => c.id !== id);
			if (selectedId === id) {
				selectedId = null;
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete collection';
			return false;
		}
	},

	async reorder(orderedIds: string[]): Promise<boolean> {
		error = null;

		try {
			await collectionsApi.reorder(orderedIds);
			// Reorder local state
			const reordered = orderedIds
				.map((id) => collections.find((c) => c.id === id))
				.filter((c): c is Collection => c !== undefined);
			collections = reordered;
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder collections';
			return false;
		}
	},

	select(id: string | null) {
		selectedId = id;
	},

	getById(id: string): Collection | undefined {
		return collections.find((c) => c.id === id);
	},

	clear() {
		collections = [];
		error = null;
		selectedId = null;
	},
};
