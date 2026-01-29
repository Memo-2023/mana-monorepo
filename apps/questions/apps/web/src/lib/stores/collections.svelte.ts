/**
 * Collections Store - Manages collections state using Svelte 5 runes
 * Authenticated users: collections from API
 * Demo mode: static sample collection to showcase the app
 */

import { collectionsApi } from '$lib/api/collections';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '$lib/types';
import { authStore } from './auth.svelte';
import { DEMO_COLLECTION, isDemoCollection } from '$lib/data/demo-questions';

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

	/**
	 * Load collections
	 * Demo mode: shows static sample collection
	 * Authenticated: fetches from API
	 */
	async load() {
		loading = true;
		error = null;

		// Demo mode: load demo collection
		if (!authStore.isAuthenticated) {
			collections = [DEMO_COLLECTION];
			loading = false;
			return;
		}

		// Authenticated: fetch from API
		try {
			collections = await collectionsApi.getAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load collections';
			collections = [];
		} finally {
			loading = false;
		}
	},

	/**
	 * Create a new collection
	 * Demo mode: returns auth_required error
	 * Authenticated: creates via API
	 */
	async create(data: CreateCollectionDto): Promise<Collection | null> {
		// Demo mode: require authentication
		if (!authStore.isAuthenticated) {
			error = 'Login required to create collections';
			return null;
		}

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

	/**
	 * Update a collection
	 * Demo mode: returns auth_required error
	 * Authenticated: updates via API
	 */
	async update(id: string, data: UpdateCollectionDto): Promise<Collection | null> {
		// Demo collection or not authenticated: require authentication
		if (isDemoCollection(id) || !authStore.isAuthenticated) {
			error = 'Login required to update collections';
			return null;
		}

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

	/**
	 * Delete a collection
	 * Demo mode: returns auth_required error
	 * Authenticated: deletes via API
	 */
	async delete(id: string): Promise<boolean> {
		// Demo collection or not authenticated: require authentication
		if (isDemoCollection(id) || !authStore.isAuthenticated) {
			error = 'Login required to delete collections';
			return false;
		}

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

	/**
	 * Reorder collections
	 * Demo mode: returns auth_required error
	 * Authenticated: reorders via API
	 */
	async reorder(orderedIds: string[]): Promise<boolean> {
		// Demo mode: require authentication
		if (!authStore.isAuthenticated) {
			error = 'Login required to reorder collections';
			return false;
		}

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

	/**
	 * Check if a collection is a demo collection
	 */
	isDemoCollection(id: string): boolean {
		return isDemoCollection(id);
	},

	clear() {
		collections = [];
		error = null;
		selectedId = null;
	},
};
