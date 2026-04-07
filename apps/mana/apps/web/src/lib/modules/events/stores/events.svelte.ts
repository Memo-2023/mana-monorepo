/**
 * Events store — mutation-only service.
 *
 * Creates a TimeBlock + LocalSocialEvent pair so events show up in calendar
 * via the universal time view (sourceModule: 'events').
 */

import { db } from '$lib/data/database';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import type { LocalSocialEvent, LocalEventItem, EventStatus } from '../types';
import { eventsApi } from '../api';
import { recordTombstone } from '../tombstones';

let error = $state<string | null>(null);

export const eventsStore = {
	get error() {
		return error;
	},

	async createEvent(input: {
		title: string;
		description?: string | null;
		location?: string | null;
		locationUrl?: string | null;
		startTime: string;
		endTime: string;
		isAllDay?: boolean;
		hostContactId?: string | null;
		coverImage?: string | null;
		color?: string | null;
		capacity?: number | null;
		status?: EventStatus;
	}) {
		error = null;
		try {
			const eventId = crypto.randomUUID();

			const timeBlockId = await createBlock({
				startDate: input.startTime,
				endDate: input.endTime,
				allDay: input.isAllDay ?? false,
				kind: 'scheduled',
				type: 'event',
				sourceModule: 'events',
				sourceId: eventId,
				title: input.title,
				description: input.description ?? null,
				color: input.color ?? null,
			});

			const newLocal: LocalSocialEvent = {
				id: eventId,
				timeBlockId,
				title: input.title,
				description: input.description ?? null,
				location: input.location ?? null,
				locationUrl: input.locationUrl ?? null,
				hostContactId: input.hostContactId ?? null,
				coverImage: input.coverImage ?? null,
				color: input.color ?? null,
				capacity: input.capacity ?? null,
				isPublished: false,
				publicToken: null,
				status: input.status ?? 'draft',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalSocialEvent>('socialEvents').add(newLocal);
			return { success: true as const, id: eventId };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create event';
			return { success: false as const, error };
		}
	},

	async updateEvent(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			location?: string | null;
			locationUrl?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			color?: string | null;
			capacity?: number | null;
			status?: EventStatus;
			coverImage?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!event) return { success: false as const, error: 'Event not found' };

			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(event.timeBlockId, blockUpdates);
			}

			const localData: Partial<LocalSocialEvent> = {
				updatedAt: new Date().toISOString(),
			};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.locationUrl !== undefined) localData.locationUrl = input.locationUrl;
			if (input.color !== undefined) localData.color = input.color;
			if (input.capacity !== undefined) localData.capacity = input.capacity;
			if (input.status !== undefined) localData.status = input.status;
			if (input.coverImage !== undefined) localData.coverImage = input.coverImage;

			await db.table('socialEvents').update(id, localData);
			// Fire-and-forget snapshot sync if this event is published
			void this.syncSnapshotIfPublished(id);
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
			return { success: false as const, error };
		}
	},

	async deleteEvent(id: string) {
		error = null;
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}
			if (event?.isPublished) {
				try {
					await eventsApi.unpublish(id);
				} catch (e) {
					console.warn(
						'Failed to delete server snapshot during deleteEvent, queuing tombstone:',
						e
					);
					if (event.publicToken) await recordTombstone(id, event.publicToken);
				}
			}
			await db.table('socialEvents').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete event';
			return { success: false as const, error };
		}
	},

	/**
	 * Publish event — pushes a snapshot to mana-events and stores the
	 * server-issued token locally. Public RSVP page will read the snapshot.
	 */
	async publishEvent(id: string) {
		error = null;
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!event) return { success: false as const, error: 'Event not found' };
			const block = await timeBlockTable.get(event.timeBlockId);
			if (!block) return { success: false as const, error: 'TimeBlock missing for event' };

			const { token } = await eventsApi.publish({
				eventId: id,
				title: event.title,
				description: event.description ?? null,
				location: event.location ?? null,
				locationUrl: event.locationUrl ?? null,
				startAt: block.startDate,
				endAt: block.endDate ?? null,
				allDay: block.allDay ?? false,
				coverImageUrl: event.coverImage ?? null,
				color: event.color ?? null,
				capacity: event.capacity ?? null,
			});

			await db.table('socialEvents').update(id, {
				isPublished: true,
				publicToken: token,
				status: 'published' satisfies EventStatus,
				updatedAt: new Date().toISOString(),
			});
			// Push any pre-existing bring-list items right away so the
			// public page shows them on first open.
			await this.syncItems(id);
			return { success: true as const, token };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to publish event';
			return { success: false as const, error };
		}
	},

	async unpublishEvent(id: string) {
		error = null;
		try {
			// Capture the token before we wipe it locally so the tombstone
			// queue (if needed) has something to retry against.
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			const tokenForRetry = event?.publicToken ?? null;

			try {
				await eventsApi.unpublish(id);
			} catch (e) {
				console.warn('Failed to delete server snapshot during unpublish, queuing tombstone:', e);
				if (tokenForRetry) await recordTombstone(id, tokenForRetry);
			}
			await db.table('socialEvents').update(id, {
				isPublished: false,
				publicToken: null,
				status: 'draft' satisfies EventStatus,
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to unpublish event';
			return { success: false as const, error };
		}
	},

	/**
	 * Push the latest local state of a published event to the server snapshot.
	 * Called after an updateEvent() if the event is currently published.
	 * Also pushes the bring-list items so the public page stays in sync.
	 */
	async syncSnapshotIfPublished(id: string) {
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!event || !event.isPublished) return;
			const block = await timeBlockTable.get(event.timeBlockId);
			if (!block) return;
			await eventsApi.updateSnapshot(id, {
				eventId: id,
				title: event.title,
				description: event.description ?? null,
				location: event.location ?? null,
				locationUrl: event.locationUrl ?? null,
				startAt: block.startDate,
				endAt: block.endDate ?? null,
				allDay: block.allDay ?? false,
				coverImageUrl: event.coverImage ?? null,
				color: event.color ?? null,
				capacity: event.capacity ?? null,
			});
			// Items are independent of the snapshot fields above but the
			// host always wants them in sync after any edit.
			await this.syncItems(id);
		} catch (e) {
			console.warn('Snapshot sync failed:', e);
		}
	},

	/**
	 * Push the local bring list to the server snapshot. Safe to call
	 * for unpublished events — it just no-ops.
	 */
	async syncItems(id: string) {
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!event || !event.isPublished) return;
			const items = await db
				.table<LocalEventItem>('eventItems')
				.where('eventId')
				.equals(id)
				.toArray();
			const payload = items
				.filter((i) => !i.deletedAt)
				.map((i) => ({
					id: i.id,
					label: i.label,
					quantity: i.quantity ?? null,
					order: i.order ?? 0,
					done: i.done ?? false,
				}));
			await eventsApi.syncItems(id, payload);
		} catch (e) {
			console.warn('Item sync failed:', e);
		}
	},
};
