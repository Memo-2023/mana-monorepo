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
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
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

			await db.table<LocalEvent>('events').add(newLocal);
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

			await db.table('events').update(id, localData);
			CalendarEvents.eventUpdated();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
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
