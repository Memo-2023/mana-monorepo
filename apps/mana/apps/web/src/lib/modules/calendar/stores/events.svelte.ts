/**
 * Events Store — Mutation-Only Service
 *
 * Creates both a TimeBlock (time dimension) and a LocalEvent (domain data)
 * for each calendar event. Updates route time changes to the TimeBlock and
 * domain changes to the LocalEvent.
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { db } from '$lib/data/database';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import {
	cleanupFutureInstances,
	deleteAllInstances,
	regenerateForBlock,
} from '$lib/data/time-blocks/recurrence';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
import type { LocalEvent, CalendarEvent } from '../types';
import { CalendarEvents } from '@mana/shared-utils/analytics';

let error = $state<string | null>(null);
let draftEvent = $state<CalendarEvent | null>(null);

export const eventsStore = {
	get error() {
		return error;
	},
	get draftEvent() {
		return draftEvent;
	},

	/**
	 * Create a new event — creates TimeBlock + LocalEvent in IndexedDB.
	 */
	async createEvent(input: {
		calendarId: string;
		title: string;
		description?: string | null;
		startTime: string;
		endTime: string;
		isAllDay?: boolean;
		location?: string | null;
		recurrenceRule?: string | null;
		color?: string | null;
	}) {
		error = null;
		try {
			const eventId = crypto.randomUUID();

			// 1. Create TimeBlock (owns time dimension)
			const timeBlockId = await createBlock({
				startDate: input.startTime,
				endDate: input.endTime,
				allDay: input.isAllDay ?? false,
				recurrenceRule: input.recurrenceRule ?? null,
				kind: 'scheduled',
				type: 'event',
				sourceModule: 'calendar',
				sourceId: eventId,
				title: input.title,
				description: input.description ?? null,
				color: input.color ?? null,
			});

			// 2. Create LocalEvent (domain data)
			const newLocal: LocalEvent = {
				id: eventId,
				calendarId: input.calendarId,
				timeBlockId,
				title: input.title,
				description: input.description ?? null,
				location: input.location ?? null,
				color: input.color ?? null,
				reminders: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// title/description/location are encrypted at rest. createBlock
			// already handled the TimeBlock side; this wraps the LocalEvent
			// row before the Dexie write. UI never sees this mutation —
			// reads go through queries.ts which decrypts on the way out.
			await encryptRecord('events', newLocal);
			await db.table<LocalEvent>('events').add(newLocal);
			emitDomainEvent('CalendarEventCreated', 'calendar', 'events', eventId, {
				eventId,
				title: input.title,
				startTime: input.startTime,
				endTime: input.endTime,
				isAllDay: input.isAllDay ?? false,
				isRecurring: !!input.recurrenceRule,
				calendarId: input.calendarId,
				location: input.location,
			});
			CalendarEvents.eventCreated(!!input.recurrenceRule);
			return { success: true, data: { id: eventId, timeBlockId } };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create event';
			return { success: false, error };
		}
	},

	/**
	 * Update an event — routes time changes to TimeBlock, domain changes to LocalEvent.
	 */
	async updateEvent(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			recurrenceRule?: string | null;
			color?: string | null;
			calendarId?: string;
		}
	) {
		error = null;
		try {
			// Get the event to find its timeBlockId
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Update TimeBlock for time-related fields
			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.recurrenceRule !== undefined) blockUpdates.recurrenceRule = input.recurrenceRule;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(event.timeBlockId, blockUpdates);
			}

			// Update LocalEvent for domain fields
			const localData: Partial<LocalEvent> = {
				updatedAt: new Date().toISOString(),
			};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.color !== undefined) localData.color = input.color;
			if (input.calendarId !== undefined) localData.calendarId = input.calendarId;

			await encryptRecord('events', localData);
			await db.table('events').update(id, localData);
			emitDomainEvent('CalendarEventUpdated', 'calendar', 'events', id, {
				eventId: id,
				fields: Object.keys(input).filter((k) => input[k as keyof typeof input] !== undefined),
			});
			CalendarEvents.eventUpdated();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
			return { success: false, error };
		}
	},

	/**
	 * Update a single instance of a recurring event.
	 * Marks the instance as an exception so regeneration won't overwrite it.
	 */
	async updateSingleInstance(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			color?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Mark the TimeBlock as an exception
			const blockUpdates: Record<string, unknown> = { isRecurrenceException: true };
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			await updateBlock(event.timeBlockId, blockUpdates);

			// Update LocalEvent
			const localData: Partial<LocalEvent> = { updatedAt: new Date().toISOString() };
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.color !== undefined) localData.color = input.color;

			await encryptRecord('events', localData);
			await db.table('events').update(id, localData);
			CalendarEvents.eventUpdated();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update instance';
			return { success: false, error };
		}
	},

	/**
	 * Update this and all future instances — updates the template rule/data
	 * and regenerates future instances.
	 */
	async updateAllFuture(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			recurrenceRule?: string | null;
			color?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Find the template block (parent)
			const block = await timeBlockTable.get(event.timeBlockId);
			const templateBlockId = block?.parentBlockId || event.timeBlockId;

			// Update template block
			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.recurrenceRule !== undefined) blockUpdates.recurrenceRule = input.recurrenceRule;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(templateBlockId, blockUpdates);
			}

			// Update template's LocalEvent
			const templateEvent = await db
				.table<LocalEvent>('events')
				.where('timeBlockId')
				.equals(templateBlockId)
				.first();
			if (templateEvent) {
				const localData: Partial<LocalEvent> = { updatedAt: new Date().toISOString() };
				if (input.title !== undefined) localData.title = input.title;
				if (input.description !== undefined) localData.description = input.description;
				if (input.location !== undefined) localData.location = input.location;
				if (input.color !== undefined) localData.color = input.color;
				await encryptRecord('events', localData);
				await db.table('events').update(templateEvent.id, localData);
			}

			// Regenerate future instances
			await regenerateForBlock(templateBlockId);
			CalendarEvents.eventUpdated();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update series';
			return { success: false, error };
		}
	},

	/**
	 * Delete a single instance of a recurring event.
	 */
	async deleteSingleInstance(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}
			await db.table('events').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete instance';
			return { success: false, error };
		}
	},

	/**
	 * Delete entire recurring series (template + all instances).
	 */
	async deleteAllInSeries(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			const block = await timeBlockTable.get(event.timeBlockId);
			const templateBlockId = block?.parentBlockId || event.timeBlockId;

			// Delete all instances
			await deleteAllInstances(templateBlockId);

			// Soft-delete all LocalEvents linked to instance blocks
			const instanceBlocks = await timeBlockTable
				.where('parentBlockId')
				.equals(templateBlockId)
				.toArray();
			const blockIds = new Set([templateBlockId, ...instanceBlocks.map((b) => b.id)]);
			const allEvents = await db.table<LocalEvent>('events').toArray();
			const now = new Date().toISOString();
			for (const ev of allEvents) {
				if (blockIds.has(ev.timeBlockId) && !ev.deletedAt) {
					await db.table('events').update(ev.id, { deletedAt: now, updatedAt: now });
				}
			}

			// Delete template block itself
			await deleteBlock(templateBlockId);

			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete series';
			return { success: false, error };
		}
	},

	/**
	 * Delete an event — soft-deletes both TimeBlock and LocalEvent.
	 */
	async deleteEvent(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}

			await db.table('events').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			emitDomainEvent('CalendarEventDeleted', 'calendar', 'events', id, {
				eventId: id,
				title: event?.title ?? '',
				wasRecurring: false,
			});
			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete event';
			return { success: false, error };
		}
	},

	/**
	 * Update tag IDs on an event (merge-safe).
	 */
	async updateTagIds(id: string, tagIds: string[]) {
		await db.table('events').update(id, {
			tagIds,
			updatedAt: new Date().toISOString(),
		});
	},

	// ========== Draft Event Methods ==========

	createDraftEvent(data: Partial<CalendarEvent>) {
		draftEvent = {
			id: '__draft__',
			calendarId: data.calendarId || '',
			timeBlockId: '__draft_block__',
			title: data.title || '',
			description: data.description || null,
			location: data.location || null,
			startTime: data.startTime || new Date().toISOString(),
			endTime: data.endTime || new Date().toISOString(),
			isAllDay: data.isAllDay || false,
			timezone: null,
			recurrenceRule: null,
			parentEventId: null,
			color: data.color || null,
			tagIds: data.tagIds || [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			blockType: 'event',
			sourceModule: 'calendar',
			sourceId: '__draft__',
			icon: null,
			isLive: false,
			projectId: null,
			linkedBlockId: null,
			parentBlockId: null,
			recurrenceDate: null,
		};
		return draftEvent;
	},

	updateDraftEvent(data: Partial<CalendarEvent>) {
		if (draftEvent) {
			draftEvent = { ...draftEvent, ...data };
		}
	},

	clearDraftEvent() {
		draftEvent = null;
	},

	isDraftEvent(eventId: string) {
		return eventId === '__draft__';
	},

	getParentEventId(eventId: string): string {
		if (eventId.includes('__recurrence__')) {
			return eventId.split('__recurrence__')[0];
		}
		return eventId;
	},
};
