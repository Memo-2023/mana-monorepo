/**
 * Items Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB via local-store.
 */

import type { ItemStatus, PurchaseData, ItemPhoto, ItemNote } from '@inventar/shared';
import { itemCollection, type LocalItem } from '$lib/data/local-store';
import { toItem } from '$lib/data/queries';

export const itemsStore = {
	async create(data: {
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
	}) {
		const existing = await itemCollection.getAll();
		const collectionItems = existing.filter((i) => i.collectionId === data.collectionId);

		const newLocal: LocalItem = {
			id: crypto.randomUUID(),
			collectionId: data.collectionId,
			name: data.name,
			description: data.description ?? null,
			status: data.status || 'owned',
			quantity: data.quantity || 1,
			locationId: data.locationId ?? null,
			categoryId: data.categoryId ?? null,
			fieldValues: data.fieldValues || {},
			purchaseData: data.purchaseData ?? null,
			photos: [],
			notes: [],
			tags: data.tags || [],
			order: collectionItems.length,
		};
		const inserted = await itemCollection.insert(newLocal);
		return toItem(inserted);
	},

	async update(
		id: string,
		data: Partial<
			Pick<
				LocalItem,
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
		await itemCollection.update(id, data);
	},

	async delete(id: string) {
		await itemCollection.delete(id);
	},

	async deleteByCollection(collectionId: string) {
		const all = await itemCollection.getAll();
		const toDelete = all.filter((i) => i.collectionId === collectionId);
		for (const item of toDelete) {
			await itemCollection.delete(item.id);
		}
	},

	async addNote(itemId: string, content: string) {
		const item = await itemCollection.get(itemId);
		if (!item) return;
		const now = new Date().toISOString();
		const note: ItemNote = { id: crypto.randomUUID(), content, createdAt: now, updatedAt: now };
		await itemCollection.update(itemId, {
			notes: [...item.notes, note],
		});
	},

	async updateNote(itemId: string, noteId: string, content: string) {
		const item = await itemCollection.get(itemId);
		if (!item) return;
		const now = new Date().toISOString();
		await itemCollection.update(itemId, {
			notes: item.notes.map((n) => (n.id === noteId ? { ...n, content, updatedAt: now } : n)),
		});
	},

	async deleteNote(itemId: string, noteId: string) {
		const item = await itemCollection.get(itemId);
		if (!item) return;
		await itemCollection.update(itemId, {
			notes: item.notes.filter((n) => n.id !== noteId),
		});
	},

	async addPhoto(itemId: string, photo: Omit<ItemPhoto, 'id' | 'order'>) {
		const item = await itemCollection.get(itemId);
		if (!item) return;
		const newPhoto: ItemPhoto = { ...photo, id: crypto.randomUUID(), order: item.photos.length };
		await itemCollection.update(itemId, {
			photos: [...item.photos, newPhoto],
		});
	},

	async deletePhoto(itemId: string, photoId: string) {
		const item = await itemCollection.get(itemId);
		if (!item) return;
		await itemCollection.update(itemId, {
			photos: item.photos.filter((p) => p.id !== photoId),
		});
	},
};
