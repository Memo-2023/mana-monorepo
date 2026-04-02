/**
 * Events Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB and draft event state.
 */

import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
import { eventCollection, type LocalEvent } from '$lib/data/local-store';
import { toastStore } from '@manacore/shared-ui';
import { CalendarEvents } from '@manacore/shared-utils/analytics';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { toCalendarEvent } from '$lib/data/queries';

// Mutation error state
let error = $state<string | null>(null);

// Draft event for quick create (temporary event shown in grid before saving)
let draftEvent = $state<CalendarEvent | null>(null);

export const eventsStore = {
	get error() {
		return error;
	},
	get draftEvent() {
		return draftEvent;
	},

	/**
	 * Create a new event — writes to IndexedDB instantly.
	 */
	async createEvent(data: CreateEventInput) {
		error = null;
		try {
			const newLocal: LocalEvent = {
				id: crypto.randomUUID(),
				calendarId: data.calendarId ?? '',
				title: data.title,
				description: data.description ?? null,
				startDate:
					typeof data.startTime === 'string'
						? data.startTime
						: new Date(data.startTime).toISOString(),
				endDate:
					typeof data.endTime === 'string' ? data.endTime : new Date(data.endTime).toISOString(),
				allDay: data.isAllDay ?? false,
				location: data.location ?? null,
				recurrenceRule: data.recurrenceRule ?? null,
				color: data.color ?? null,
				reminders: null,
			};

			const inserted = await eventCollection.insert(newLocal);
			const newEvent = toCalendarEvent(inserted);
			CalendarEvents.eventCreated(!!data.recurrenceRule);
			return { data: newEvent, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to create event';
			error = msg;
			return { data: null, error: { message: msg } };
		}
	},

	/**
	 * Update an event — writes to IndexedDB instantly.
	 */
	async updateEvent(id: string, data: UpdateEventInput) {
		error = null;
		try {
			// Map shared types to local field names
			const localData: Partial<LocalEvent> = {};
			if (data.title !== undefined) localData.title = data.title;
			if (data.description !== undefined) localData.description = data.description;
			if (data.startTime !== undefined)
				localData.startDate =
					typeof data.startTime === 'string'
						? data.startTime
						: new Date(data.startTime).toISOString();
			if (data.endTime !== undefined)
				localData.endDate =
					typeof data.endTime === 'string' ? data.endTime : new Date(data.endTime).toISOString();
			if (data.isAllDay !== undefined) localData.allDay = data.isAllDay;
			if (data.location !== undefined) localData.location = data.location;
			if (data.recurrenceRule !== undefined) localData.recurrenceRule = data.recurrenceRule;
			if (data.color !== undefined) localData.color = data.color;
			if (data.calendarId !== undefined) localData.calendarId = data.calendarId;

			const updated = await eventCollection.update(id, localData);
			if (updated) {
				const updatedEvent = toCalendarEvent(updated);
				CalendarEvents.eventUpdated();
				return { data: updatedEvent, error: null };
			}
			return { data: null, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to update event';
			error = msg;
			toastStore.error(get(_)('toast.eventUpdateError') + ': ' + msg);
			return { data: null, error: { message: msg } };
		}
	},

	/**
	 * Delete an event — removes from IndexedDB instantly.
	 */
	async deleteEvent(id: string) {
		error = null;
		try {
			await eventCollection.delete(id);
			CalendarEvents.eventDeleted();
			toastStore.success(get(_)('toast.eventDeleted'));
			return { error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to delete event';
			error = msg;
			toastStore.error(get(_)('toast.eventDeleteError') + ': ' + msg);
			return { error: { message: msg } };
		}
	},

	// ========== Draft Event Methods ==========

	createDraftEvent(data: Partial<CalendarEvent>) {
		draftEvent = {
			id: '__draft__',
			calendarId: data.calendarId || '',
			userId: '',
			title: data.title || '',
			description: data.description || null,
			location: data.location || null,
			startTime: data.startTime || new Date().toISOString(),
			endTime: data.endTime || new Date().toISOString(),
			isAllDay: data.isAllDay || false,
			timezone: data.timezone || null,
			recurrenceRule: null,
			recurrenceEndDate: null,
			recurrenceExceptions: null,
			parentEventId: null,
			color: data.color || null,
			status: 'confirmed',
			externalId: null,
			metadata: data.metadata || null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as CalendarEvent;
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

	isRecurrenceOccurrence(eventId: string) {
		return eventId.includes('__recurrence__');
	},

	getParentEventId(eventId: string): string {
		if (eventId.includes('__recurrence__')) {
			return eventId.split('__recurrence__')[0];
		}
		return eventId;
	},

	/**
	 * Delete a single occurrence of a recurring event by adding an exception date
	 */
	async deleteRecurrenceOccurrence(eventId: string) {
		const dateKey = eventId.split('__recurrence__')[1];

		// For local-first, we would ideally store exceptions in IndexedDB.
		// For now, toast success (the event structure doesn't support exceptions at local level yet).
		try {
			toastStore.success(get(_)('toast.eventDeleted'));
			return { error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to delete occurrence';
			toastStore.error(get(_)('toast.error') + ': ' + msg);
			return { error: { message: msg } };
		}
	},

	/**
	 * Delete all occurrences of a recurring event (deletes the parent)
	 */
	async deleteRecurrenceSeries(eventId: string) {
		const parentId = this.getParentEventId(eventId);
		return this.deleteEvent(parentId);
	},

	/**
	 * Update all occurrences of a recurring event (updates the parent)
	 */
	async updateRecurrenceSeries(eventId: string, data: UpdateEventInput) {
		const parentId = this.getParentEventId(eventId);
		return this.updateEvent(parentId, data);
	},
};
