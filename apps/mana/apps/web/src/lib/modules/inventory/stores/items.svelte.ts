/**
 * Items Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { invItemTable } from '../collections';
import { toItem } from '../queries';
import type { LocalItem } from '../types';
import type { ItemStatus } from '../queries';
import { InventoryEvents } from '@mana/shared-utils/analytics';
import { encryptRecord } from '$lib/data/crypto';

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
		purchaseData?: LocalItem['purchaseData'];
		tags?: string[];
	}) {
		const existing = await invItemTable.toArray();
		const collectionItems = existing.filter(
			(i) => !i.deletedAt && i.collectionId === data.collectionId
		);

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
		const plaintextSnapshot = toItem(newLocal);
		await encryptRecord('invItems', newLocal);
		await invItemTable.add(newLocal);
		InventoryEvents.itemCreated();
		return plaintextSnapshot;
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
		const diff: Partial<LocalItem> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('invItems', diff);
		await invItemTable.update(id, diff);
		InventoryEvents.itemUpdated();
	},

	async delete(id: string) {
		await invItemTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		InventoryEvents.itemDeleted();
	},

	async deleteByCollection(collectionId: string) {
		const all = await invItemTable.toArray();
		const toDelete = all.filter((i) => !i.deletedAt && i.collectionId === collectionId);
		const now = new Date().toISOString();
		for (const item of toDelete) {
			await invItemTable.update(item.id, { deletedAt: now, updatedAt: now });
		}
	},

	async addNote(itemId: string, content: string) {
		const item = await invItemTable.get(itemId);
		if (!item) return;
		const now = new Date().toISOString();
		const note = { id: crypto.randomUUID(), content, createdAt: now };
		await invItemTable.update(itemId, {
			notes: [...item.notes, note],
			updatedAt: now,
		});
	},

	async deleteNote(itemId: string, noteId: string) {
		const item = await invItemTable.get(itemId);
		if (!item) return;
		await invItemTable.update(itemId, {
			notes: item.notes.filter((n) => n.id !== noteId),
			updatedAt: new Date().toISOString(),
		});
	},
};
