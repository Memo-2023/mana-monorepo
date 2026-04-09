/**
 * Reactive queries & pure helpers for Inventar — uses Dexie liveQuery on the unified DB.
 *
 * Uses prefixed table names: invCollections, invItems, invLocations, invCategories.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalCollection, LocalItem, LocalLocation, LocalCategory } from './types';

// ─── Shared Types (inline to avoid @inventory/shared dependency) ───

export interface Collection {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	color?: string;
	schema: LocalCollection['schema'];
	templateId?: string;
	order: number;
	itemCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Item {
	id: string;
	collectionId: string;
	locationId?: string;
	categoryId?: string;
	name: string;
	description?: string;
	status: 'owned' | 'lent' | 'stored' | 'for_sale' | 'disposed';
	quantity: number;
	fieldValues: Record<string, unknown>;
	purchaseData?: LocalItem['purchaseData'];
	photos: LocalItem['photos'];
	notes: LocalItem['notes'];
	documents: never[];
	tags: string[];
	order: number;
	createdAt: string;
	updatedAt: string;
}

export type ItemStatus = Item['status'];

export interface Location {
	id: string;
	parentId?: string;
	name: string;
	description?: string;
	icon?: string;
	path: string;
	depth: number;
	order: number;
	createdAt: string;
	updatedAt: string;
	children?: Location[];
}

export interface Category {
	id: string;
	parentId?: string;
	name: string;
	icon?: string;
	color?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
	children?: Category[];
}

export type ViewMode = 'list' | 'grid' | 'table';

export interface SortOption {
	field: string;
	direction: 'asc' | 'desc';
}

export interface FilterCriteria {
	search?: string;
	collectionId?: string;
	locationId?: string;
	categoryId?: string;
	status?: ItemStatus[];
	tagIds?: string[];
}

// ─── Type Converters ───────────────────────────────────────

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

// ─── Live Queries ──────────────────────────────────────────

export function useAllCollections() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCollection>('invCollections').toArray();
		return locals.filter((c) => !c.deletedAt).map(toCollection);
	});
}

export function useAllItems() {
	return liveQuery(async () => {
		const visible = (await db.table<LocalItem>('invItems').toArray()).filter((i) => !i.deletedAt);
		const decrypted = await decryptRecords('invItems', visible);
		return decrypted.map(toItem);
	});
}

export function useAllLocations() {
	return liveQuery(async () => {
		const locals = await db.table<LocalLocation>('invLocations').toArray();
		return locals.filter((l) => !l.deletedAt).map(toLocation);
	});
}

export function useAllCategories() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCategory>('invCategories').toArray();
		return locals.filter((c) => !c.deletedAt).map(toCategory);
	});
}

// ─── Pure Collection Helpers ──────────────────────────────

export function getCollectionById(collections: Collection[], id: string): Collection | undefined {
	return collections.find((c) => c.id === id);
}

export function getSortedCollections(collections: Collection[]): Collection[] {
	return [...collections].sort((a, b) => a.order - b.order);
}

// ─── Pure Item Helpers ────────────────────────────────────

export function getItemById(items: Item[], id: string): Item | undefined {
	return items.find((i) => i.id === id);
}

export function getItemsByCollection(items: Item[], collectionId: string): Item[] {
	return items.filter((i) => i.collectionId === collectionId);
}

export function getItemCountByCollection(items: Item[], collectionId: string): number {
	return items.filter((i) => i.collectionId === collectionId).length;
}

export function getTotalItemCount(items: Item[]): number {
	return items.length;
}

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

export function getLocationById(locations: Location[], id: string): Location | undefined {
	return locations.find((l) => l.id === id);
}

export function getRootLocations(locations: Location[]): Location[] {
	return locations.filter((l) => !l.parentId).sort((a, b) => a.order - b.order);
}

export function getLocationChildren(locations: Location[], parentId: string): Location[] {
	return locations.filter((l) => l.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function getLocationTree(locations: Location[]): Location[] {
	const buildTree = (parentId?: string): Location[] => {
		return locations
			.filter((l) => l.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((l) => ({ ...l, children: buildTree(l.id) }));
	};
	return buildTree(undefined);
}

export function getLocationFullPath(locations: Location[], id: string): string {
	const location = locations.find((l) => l.id === id);
	if (!location) return '';
	return location.path ? `${location.path}/${location.name}` : location.name;
}

// ─── Pure Category Helpers ────────────────────────────────

export function getCategoryById(categories: Category[], id: string): Category | undefined {
	return categories.find((c) => c.id === id);
}

export function getRootCategories(categories: Category[]): Category[] {
	return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}

export function getCategoryChildren(categories: Category[], parentId: string): Category[] {
	return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function getCategoryTree(categories: Category[]): Category[] {
	const buildTree = (parentId?: string): Category[] => {
		return categories
			.filter((c) => c.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((c) => ({ ...c, children: buildTree(c.id) }));
	};
	return buildTree(undefined);
}
