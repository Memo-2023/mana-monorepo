import { browser } from '$app/environment';
import type {
	Item,
	ItemStatus,
	ItemNote,
	ItemPhoto,
	PurchaseData,
	SortOption,
} from '@inventar/shared';

const STORAGE_KEY = 'inventar_items';

function loadFromStorage(): Item[] {
	if (!browser) return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(items: Item[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
	return crypto.randomUUID();
}

let items = $state<Item[]>([]);
let initialized = $state(false);

export const itemsStore = {
	get items() {
		return items;
	},
	get initialized() {
		return initialized;
	},

	initialize() {
		if (initialized) return;
		items = loadFromStorage();
		initialized = true;
	},

	getById(id: string): Item | undefined {
		return items.find((i) => i.id === id);
	},

	getByCollection(collectionId: string): Item[] {
		return items.filter((i) => i.collectionId === collectionId);
	},

	getFiltered(filters: {
		collectionId?: string;
		locationId?: string;
		categoryId?: string;
		status?: ItemStatus[];
		search?: string;
		tagIds?: string[];
	}): Item[] {
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
	},

	getSorted(itemList: Item[], sort: SortOption): Item[] {
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
	},

	create(data: {
		collectionId: string;
		name: string;
		description?: string;
		status?: ItemStatus;
		quantity?: number;
		locationId?: string;
		categoryId?: string;
		fieldValues?: Record<string, unknown>;
		purchaseData?: PurchaseData;
		tags?: string[];
	}): Item {
		const now = new Date().toISOString();
		const item: Item = {
			id: generateId(),
			collectionId: data.collectionId,
			name: data.name,
			description: data.description,
			status: data.status || 'owned',
			quantity: data.quantity || 1,
			locationId: data.locationId,
			categoryId: data.categoryId,
			fieldValues: data.fieldValues || {},
			purchaseData: data.purchaseData,
			photos: [],
			notes: [],
			documents: [],
			tags: data.tags || [],
			order: items.filter((i) => i.collectionId === data.collectionId).length,
			createdAt: now,
			updatedAt: now,
		};
		items = [...items, item];
		saveToStorage(items);
		return item;
	},

	update(
		id: string,
		data: Partial<
			Pick<
				Item,
				| 'name'
				| 'description'
				| 'status'
				| 'quantity'
				| 'locationId'
				| 'categoryId'
				| 'fieldValues'
				| 'purchaseData'
				| 'tags'
			>
		>
	) {
		items = items.map((i) =>
			i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
		);
		saveToStorage(items);
	},

	delete(id: string) {
		items = items.filter((i) => i.id !== id);
		saveToStorage(items);
	},

	deleteByCollection(collectionId: string) {
		items = items.filter((i) => i.collectionId !== collectionId);
		saveToStorage(items);
	},

	addNote(itemId: string, content: string) {
		const now = new Date().toISOString();
		const note: ItemNote = { id: generateId(), content, createdAt: now, updatedAt: now };
		items = items.map((i) =>
			i.id === itemId ? { ...i, notes: [...i.notes, note], updatedAt: now } : i
		);
		saveToStorage(items);
	},

	updateNote(itemId: string, noteId: string, content: string) {
		const now = new Date().toISOString();
		items = items.map((i) =>
			i.id === itemId
				? {
						...i,
						notes: i.notes.map((n) => (n.id === noteId ? { ...n, content, updatedAt: now } : n)),
						updatedAt: now,
					}
				: i
		);
		saveToStorage(items);
	},

	deleteNote(itemId: string, noteId: string) {
		items = items.map((i) =>
			i.id === itemId
				? {
						...i,
						notes: i.notes.filter((n) => n.id !== noteId),
						updatedAt: new Date().toISOString(),
					}
				: i
		);
		saveToStorage(items);
	},

	addPhoto(itemId: string, photo: Omit<ItemPhoto, 'id' | 'order'>) {
		const item = items.find((i) => i.id === itemId);
		const newPhoto: ItemPhoto = { ...photo, id: generateId(), order: item?.photos.length || 0 };
		items = items.map((i) =>
			i.id === itemId
				? { ...i, photos: [...i.photos, newPhoto], updatedAt: new Date().toISOString() }
				: i
		);
		saveToStorage(items);
	},

	deletePhoto(itemId: string, photoId: string) {
		items = items.map((i) =>
			i.id === itemId
				? {
						...i,
						photos: i.photos.filter((p) => p.id !== photoId),
						updatedAt: new Date().toISOString(),
					}
				: i
		);
		saveToStorage(items);
	},

	getCountByCollection(collectionId: string): number {
		return items.filter((i) => i.collectionId === collectionId).length;
	},

	getTotalCount(): number {
		return items.length;
	},

	getCountByStatus(status: ItemStatus): number {
		return items.filter((i) => i.status === status).length;
	},
};
