/**
 * Reactive Queries & Pure Helpers for Inventar
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	collectionCollection,
	itemCollection,
	locationCollection,
	categoryCollection,
	type LocalCollection,
	type LocalItem,
	type LocalLocation,
	type LocalCategory,
} from './local-store';
import type {
	Collection,
	Item,
	Location,
	Category,
	ItemStatus,
	SortOption,
	FilterCriteria,
} from '@inventar/shared';

// ─── Type Converters ───────────────────────────────────────

/** Convert a LocalCollection (IndexedDB) to the shared Collection type. */
export function toCollection(local: LocalCollection): Collection {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? undefined,
		icon: local.icon ?? undefined,
		color: local.color ?? undefined,
		schema: local.schema,
		templateId: local.templateId ?? undefined,
		order: local.order,
		itemCount: local.itemCount,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert a LocalItem (IndexedDB) to the shared Item type. */
export function toItem(local: LocalItem): Item {
	return {
		id: local.id,
		collectionId: local.collectionId,
		locationId: local.locationId ?? undefined,
		categoryId: local.categoryId ?? undefined,
		name: local.name,
		description: local.description ?? undefined,
		status: local.status,
		quantity: local.quantity,
		fieldValues: local.fieldValues,
		purchaseData: local.purchaseData ?? undefined,
		photos: local.photos,
		notes: local.notes,
		documents: [],
		tags: local.tags,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert a LocalLocation (IndexedDB) to the shared Location type. */
export function toLocation(local: LocalLocation): Location {
	return {
		id: local.id,
		parentId: local.parentId ?? undefined,
		name: local.name,
		description: local.description ?? undefined,
		icon: local.icon ?? undefined,
		path: local.path,
		depth: local.depth,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert a LocalCategory (IndexedDB) to the shared Category type. */
export function toCategory(local: LocalCategory): Category {
	return {
		id: local.id,
		parentId: local.parentId ?? undefined,
		name: local.name,
		icon: local.icon ?? undefined,
		color: local.color ?? undefined,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ─────────

/** All collections. Auto-updates on any change. */
export function useAllCollections() {
	return useLiveQueryWithDefault(async () => {
		const locals = await collectionCollection.getAll();
		return locals.map(toCollection);
	}, [] as Collection[]);
}

/** All items. Auto-updates on any change. */
export function useAllItems() {
	return useLiveQueryWithDefault(async () => {
		const locals = await itemCollection.getAll();
		return locals.map(toItem);
	}, [] as Item[]);
}

/** All locations. Auto-updates on any change. */
export function useAllLocations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await locationCollection.getAll();
		return locals.map(toLocation);
	}, [] as Location[]);
}

/** All categories. Auto-updates on any change. */
export function useAllCategories() {
	return useLiveQueryWithDefault(async () => {
		const locals = await categoryCollection.getAll();
		return locals.map(toCategory);
	}, [] as Category[]);
}

// ─── Pure Collection Helpers ──────────────────────────────

/** Get a collection by ID. */
export function getCollectionById(collections: Collection[], id: string): Collection | undefined {
	return collections.find((c) => c.id === id);
}

/** Get collections sorted by order. */
export function getSortedCollections(collections: Collection[]): Collection[] {
	return [...collections].sort((a, b) => a.order - b.order);
}

// ─── Pure Item Helpers ────────────────────────────────────

/** Get an item by ID. */
export function getItemById(items: Item[], id: string): Item | undefined {
	return items.find((i) => i.id === id);
}

/** Get items for a specific collection. */
export function getItemsByCollection(items: Item[], collectionId: string): Item[] {
	return items.filter((i) => i.collectionId === collectionId);
}

/** Count items for a specific collection. */
export function getItemCountByCollection(items: Item[], collectionId: string): number {
	return items.filter((i) => i.collectionId === collectionId).length;
}

/** Get total item count. */
export function getTotalItemCount(items: Item[]): number {
	return items.length;
}

/** Filter items by criteria. */
export function getFilteredItems(items: Item[], filters: FilterCriteria): Item[] {
	let result = items;

	if (filters.collectionId) {
		result = result.filter((i) => i.collectionId === filters.collectionId);
	}
	if (filters.locationId) {
		result = result.filter((i) => i.locationId === filters.locationId);
	}
	if (filters.categoryId) {
		result = result.filter((i) => i.categoryId === filters.categoryId);
	}
	if (filters.status?.length) {
		result = result.filter((i) => filters.status!.includes(i.status));
	}
	if (filters.tagIds?.length) {
		result = result.filter((i) => filters.tagIds!.some((t) => i.tags.includes(t)));
	}
	if (filters.search) {
		const q = filters.search.toLowerCase();
		result = result.filter(
			(i) =>
				i.name.toLowerCase().includes(q) ||
				i.description?.toLowerCase().includes(q) ||
				Object.values(i.fieldValues).some((v) => String(v).toLowerCase().includes(q))
		);
	}

	return result;
}

/** Sort items by a sort option. */
export function getSortedItems(itemList: Item[], sort: SortOption): Item[] {
	return [...itemList].sort((a, b) => {
		let cmp = 0;
		switch (sort.field) {
			case 'name':
				cmp = a.name.localeCompare(b.name);
				break;
			case 'createdAt':
				cmp = a.createdAt.localeCompare(b.createdAt);
				break;
			case 'updatedAt':
				cmp = a.updatedAt.localeCompare(b.updatedAt);
				break;
			case 'status':
				cmp = a.status.localeCompare(b.status);
				break;
			case 'quantity':
				cmp = a.quantity - b.quantity;
				break;
		}
		return sort.direction === 'desc' ? -cmp : cmp;
	});
}

// ─── Pure Location Helpers ────────────────────────────────

/** Get a location by ID. */
export function getLocationById(locations: Location[], id: string): Location | undefined {
	return locations.find((l) => l.id === id);
}

/** Get root locations (no parent). */
export function getRootLocations(locations: Location[]): Location[] {
	return locations.filter((l) => !l.parentId).sort((a, b) => a.order - b.order);
}

/** Get children of a location. */
export function getLocationChildren(locations: Location[], parentId: string): Location[] {
	return locations.filter((l) => l.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Build a tree structure from flat locations. */
export function getLocationTree(locations: Location[]): Location[] {
	const buildTree = (parentId?: string): Location[] => {
		return locations
			.filter((l) => l.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((l) => ({ ...l, children: buildTree(l.id) }));
	};
	return buildTree(undefined);
}

/** Get full path for a location. */
export function getLocationFullPath(locations: Location[], id: string): string {
	const location = locations.find((l) => l.id === id);
	if (!location) return '';
	return location.path ? `${location.path}/${location.name}` : location.name;
}

// ─── Pure Category Helpers ────────────────────────────────

/** Get a category by ID. */
export function getCategoryById(categories: Category[], id: string): Category | undefined {
	return categories.find((c) => c.id === id);
}

/** Get root categories (no parent). */
export function getRootCategories(categories: Category[]): Category[] {
	return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}

/** Get children of a category. */
export function getCategoryChildren(categories: Category[], parentId: string): Category[] {
	return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Build a tree structure from flat categories. */
export function getCategoryTree(categories: Category[]): Category[] {
	const buildTree = (parentId?: string): Category[] => {
		return categories
			.filter((c) => c.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((c) => ({ ...c, children: buildTree(c.id) }));
	};
	return buildTree(undefined);
}
