/**
 * Events Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations and draft event state.
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalEvent, CalendarEvent } from '../types';
import { toCalendarEvent } from '../queries';

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
	 * Create a new event -- writes to IndexedDB instantly.
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
			const newLocal: LocalEvent = {
				id: crypto.randomUUID(),
				calendarId: input.calendarId,
				title: input.title,
				description: input.description ?? null,
				startDate: input.startTime,
				endDate: input.endTime,
				allDay: input.isAllDay ?? false,
				location: input.location ?? null,
				recurrenceRule: input.recurrenceRule ?? null,
				color: input.color ?? null,
				reminders: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalEvent>('events').add(newLocal);
			return { success: true, data: toCalendarEvent(newLocal) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create event';
			return { success: false, error };
		}
	},

	/**
	 * Update an event -- writes to IndexedDB instantly.
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
			const localData: Partial<LocalEvent> = {
				updatedAt: new Date().toISOString(),
			};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.startTime !== undefined) localData.startDate = input.startTime;
			if (input.endTime !== undefined) localData.endDate = input.endTime;
			if (input.isAllDay !== undefined) localData.allDay = input.isAllDay;
			if (input.location !== undefined) localData.location = input.location;
			if (input.recurrenceRule !== undefined) localData.recurrenceRule = input.recurrenceRule;
			if (input.color !== undefined) localData.color = input.color;
			if (input.calendarId !== undefined) localData.calendarId = input.calendarId;

			await db.table('events').update(id, localData);
			const updated = await db.table<LocalEvent>('events').get(id);
			if (updated) {
				return { success: true, data: toCalendarEvent(updated) };
			}
			return { success: false, error: 'Event not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
			return { success: false, error };
		}
	},

	/**
	 * Delete an event -- soft-deletes from IndexedDB instantly.
	 */
	async deleteEvent(id: string) {
		error = null;
		try {
			await db.table('events').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
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
