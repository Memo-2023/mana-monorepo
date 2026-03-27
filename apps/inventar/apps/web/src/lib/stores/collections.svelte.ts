import { browser } from '$app/environment';
import type { Collection, CollectionSchema } from '@inventar/shared';

const STORAGE_KEY = 'inventar_collections';

function loadFromStorage(): Collection[] {
	if (!browser) return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(collections: Collection[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

function generateId(): string {
	return crypto.randomUUID();
}

let collections = $state<Collection[]>([]);
let initialized = $state(false);

export const collectionsStore = {
	get collections() {
		return collections;
	},
	get initialized() {
		return initialized;
	},

	initialize() {
		if (initialized) return;
		collections = loadFromStorage();
		initialized = true;
	},

	getById(id: string): Collection | undefined {
		return collections.find((c) => c.id === id);
	},

	create(data: {
		name: string;
		description?: string;
		icon?: string;
		color?: string;
		schema: CollectionSchema;
		templateId?: string;
	}): Collection {
		const now = new Date().toISOString();
		const collection: Collection = {
			id: generateId(),
			name: data.name,
			description: data.description,
			icon: data.icon,
			color: data.color,
			schema: data.schema,
			templateId: data.templateId,
			order: collections.length,
			itemCount: 0,
			createdAt: now,
			updatedAt: now,
		};
		collections = [...collections, collection];
		saveToStorage(collections);
		return collection;
	},

	update(
		id: string,
		data: Partial<Pick<Collection, 'name' | 'description' | 'icon' | 'color' | 'schema'>>
	) {
		collections = collections.map((c) =>
			c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
		);
		saveToStorage(collections);
	},

	delete(id: string) {
		collections = collections.filter((c) => c.id !== id);
		saveToStorage(collections);
	},

	reorder(orderedIds: string[]) {
		collections = orderedIds
			.map((id, index) => {
				const c = collections.find((col) => col.id === id);
				return c ? { ...c, order: index } : null;
			})
			.filter((c): c is Collection => c !== null);
		saveToStorage(collections);
	},

	updateItemCount(collectionId: string, count: number) {
		collections = collections.map((c) => (c.id === collectionId ? { ...c, itemCount: count } : c));
		saveToStorage(collections);
	},
};
