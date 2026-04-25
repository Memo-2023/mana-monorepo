/**
 * Bring-list items store — mutation-only service for the "wer bringt was?"
 * list attached to an event.
 */

import { db } from '$lib/data/database';
import { getEffectiveSpaceId } from '$lib/data/scope';
import type { LocalEventItem } from '../types';
import { eventsStore } from './events.svelte';

let error = $state<string | null>(null);

async function nextOrder(eventId: string): Promise<number> {
	const existing = await db
		.table<LocalEventItem>('eventItems')
		.where('eventId')
		.equals(eventId)
		.toArray();
	const max = existing.filter((i) => !i.deletedAt).reduce((m, i) => Math.max(m, i.order ?? 0), -1);
	return max + 1;
}

export const eventItemsStore = {
	get error() {
		return error;
	},

	async addItem(input: {
		eventId: string;
		label: string;
		quantity?: number | null;
		assignedGuestId?: string | null;
	}) {
		error = null;
		try {
			const id = crypto.randomUUID();
			const order = await nextOrder(input.eventId);
			const newItem: LocalEventItem = {
				id,
				eventId: input.eventId,
				label: input.label.trim(),
				quantity: input.quantity ?? null,
				order,
				done: false,
				assignedGuestId: input.assignedGuestId ?? null,
				claimedByName: null,
				claimedAt: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await db.table('eventItems').add({ ...newItem, spaceId: getEffectiveSpaceId() });
			void eventsStore.syncItems(input.eventId);
			return { success: true as const, id };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add item';
			return { success: false as const, error };
		}
	},

	async updateItem(
		id: string,
		input: Partial<{
			label: string;
			quantity: number | null;
			done: boolean;
			assignedGuestId: string | null;
			claimedByName: string | null;
			claimedAt: string | null;
		}>
	) {
		error = null;
		try {
			await db.table('eventItems').update(id, {
				...input,
				updatedAt: new Date().toISOString(),
			});
			// Push the updated bring list to the server. We need the
			// parent eventId, so re-read the row first.
			const item = await db.table<LocalEventItem>('eventItems').get(id);
			if (item) void eventsStore.syncItems(item.eventId);
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update item';
			return { success: false as const, error };
		}
	},

	async toggleDone(id: string, done: boolean) {
		return this.updateItem(id, { done });
	},

	async assign(id: string, guestId: string | null) {
		return this.updateItem(id, {
			assignedGuestId: guestId,
			// Clearing the public-claim when the host takes over the assignment
			// avoids double-counting in the host's view.
			...(guestId ? { claimedByName: null, claimedAt: null } : {}),
		});
	},

	async deleteItem(id: string) {
		error = null;
		try {
			const item = await db.table<LocalEventItem>('eventItems').get(id);
			await db.table('eventItems').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			if (item) void eventsStore.syncItems(item.eventId);
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete item';
			return { success: false as const, error };
		}
	},
};
