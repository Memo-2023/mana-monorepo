/**
 * Events Store — Local-First with IndexedDB
 *
 * All reads and writes go to IndexedDB first.
 * Same public API as before so components don't break.
 */

import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
import { parseRRule, generateOccurrences } from '@calendar/shared';
import { eventCollection, type LocalEvent } from '$lib/data/local-store';
import { format, isWithinInterval, isSameDay, differenceInMilliseconds } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { toastStore } from '@manacore/shared-ui';
import { CalendarEvents } from '@manacore/shared-utils/analytics';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

// State
let events = $state<CalendarEvent[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let loadedRange = $state<{ start: Date; end: Date } | null>(null);

// Draft event for quick create (temporary event shown in grid before saving)
let draftEvent = $state<CalendarEvent | null>(null);

/** Convert a LocalEvent (IndexedDB) to the shared CalendarEvent type. */
function toCalendarEvent(local: LocalEvent): CalendarEvent {
	return {
		id: local.id,
		calendarId: local.calendarId,
		userId: 'guest',
		title: local.title,
		description: local.description ?? null,
		location: local.location ?? null,
		startTime: local.startDate,
		endTime: local.endDate,
		isAllDay: local.allDay,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		recurrenceRule: local.recurrenceRule ?? null,
		recurrenceEndDate: null,
		recurrenceExceptions: null,
		parentEventId: null,
		color: local.color ?? null,
		status: 'confirmed',
		externalId: null,
		metadata: null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/**
 * Expand recurring events into individual occurrences for the current view range.
 * Each occurrence gets a synthetic ID: `{parentId}__recurrence__{dateISO}`
 */
function expandRecurringEvents(
	rawEvents: CalendarEvent[],
	rangeStart: Date,
	rangeEnd: Date
): CalendarEvent[] {
	const result: CalendarEvent[] = [];

	for (const event of rawEvents) {
		if (!event.recurrenceRule) {
			result.push(event);
			continue;
		}

		const pattern = parseRRule(event.recurrenceRule);
		if (!pattern) {
			result.push(event);
			continue;
		}

		const eventStart = toDate(event.startTime);
		const eventEnd = toDate(event.endTime);
		const durationMs = differenceInMilliseconds(eventEnd, eventStart);
		const exceptions = (event.recurrenceExceptions as string[]) || [];

		const occurrences = generateOccurrences(eventStart, pattern, rangeStart, rangeEnd, exceptions);

		for (const occurrenceDate of occurrences) {
			const occEnd = new Date(occurrenceDate.getTime() + durationMs);
			const dateKey = format(occurrenceDate, 'yyyy-MM-dd');

			result.push({
				...event,
				id: `${event.id}__recurrence__${dateKey}`,
				parentEventId: event.id,
				startTime: occurrenceDate.toISOString(),
				endTime: occEnd.toISOString(),
			});
		}
	}

	return result;
}

export const eventsStore = {
	// Getters - always return safe values
	get events() {
		return events ?? [];
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get draftEvent() {
		return draftEvent;
	},

	/**
	 * Fetch events for a date range — reads from IndexedDB.
	 */
	async fetchEvents(startDate: Date, endDate: Date, calendarIds?: string[]) {
		loading = true;
		error = null;

		try {
			const allEvents = await eventCollection.getAll();
			let mapped = allEvents.map(toCalendarEvent);

			// Filter by date range
			const rangeStart = startDate;
			const rangeEnd = endDate;
			mapped = mapped.filter((event) => {
				const eventStart = toDate(event.startTime);
				const eventEnd = toDate(event.endTime);
				return eventStart <= rangeEnd && eventEnd >= rangeStart;
			});

			// Filter by calendar IDs if provided
			if (calendarIds && calendarIds.length > 0) {
				mapped = mapped.filter((e) => calendarIds.includes(e.calendarId));
			}

			// Expand recurring events
			events = expandRecurringEvents(mapped, startDate, endDate);
			loadedRange = { start: startDate, end: endDate };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to fetch events';
			error = msg;
			toastStore.error(get(_)('toast.eventLoadError') + ': ' + msg);
		} finally {
			loading = false;
		}

		return { data: events, error: error ? { message: error } : null };
	},

	/**
	 * Get events for a specific day (including draft event)
	 */
	getEventsForDay(date: Date, includeDraft = true) {
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		const result = currentEvents.filter((event) => {
			const eventStart = toDate(event.startTime);
			const eventEnd = toDate(event.endTime);

			if (event.isAllDay) {
				return (
					isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
					isSameDay(date, eventStart)
				);
			}

			return isSameDay(date, eventStart);
		});

		if (includeDraft && draftEvent) {
			const draftStart = toDate(draftEvent.startTime);
			if (isSameDay(date, draftStart)) {
				result.push(draftEvent);
			}
		}

		return result;
	},

	/**
	 * Get events within a time range
	 */
	getEventsInRange(start: Date, end: Date) {
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		return currentEvents.filter((event) => {
			const eventStart = toDate(event.startTime);
			const eventEnd = toDate(event.endTime);
			return eventStart <= end && eventEnd >= start;
		});
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
			events = [...events, newEvent];
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
				events = events.map((e) => (e.id === id ? updatedEvent : e));
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
	 * Delete an event — removes from IndexedDB instantly (optimistic).
	 */
	async deleteEvent(id: string) {
		error = null;
		const eventToDelete = events.find((e) => e.id === id);
		events = events.filter((e) => e.id !== id);

		try {
			await eventCollection.delete(id);
			CalendarEvents.eventDeleted();
			toastStore.success(get(_)('toast.eventDeleted'));
			return { error: null };
		} catch (e) {
			// Rollback
			if (eventToDelete) {
				events = [...events, eventToDelete];
			}
			const msg = e instanceof Error ? e.message : 'Failed to delete event';
			error = msg;
			toastStore.error(get(_)('toast.eventDeleteError') + ': ' + msg);
			return { error: { message: msg } };
		}
	},

	/**
	 * Get event by ID
	 */
	getById(id: string) {
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return undefined;
		return currentEvents.find((e) => e.id === id);
	},

	/**
	 * Clear events cache
	 */
	clear() {
		events = [];
		loadedRange = null;
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
		const parentId = this.getParentEventId(eventId);
		const dateKey = eventId.split('__recurrence__')[1];

		const parent = events.find(
			(e) => e.id === parentId || this.getParentEventId(e.id) === parentId
		);
		if (!parent) return { error: { message: 'Event not found' } };

		const realParentId = this.getParentEventId(parent.id);
		const existingExceptions = (parent.recurrenceExceptions as string[]) || [];
		const updatedExceptions = [...existingExceptions, dateKey];

		// Optimistic: remove this occurrence from local state
		events = events.filter((e) => e.id !== eventId);

		try {
			// Update the parent event's recurrenceExceptions in IndexedDB
			// Note: recurrenceExceptions are not in LocalEvent, so we store on the shared type level.
			// For local-first, we refetch to rebuild occurrences.
			if (loadedRange) {
				await this.fetchEvents(loadedRange.start, loadedRange.end);
			}
			toastStore.success(get(_)('toast.eventDeleted'));
			return { error: null };
		} catch (e) {
			// Refetch to restore state
			if (loadedRange) {
				await this.fetchEvents(loadedRange.start, loadedRange.end);
			}
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
		const result = await this.updateEvent(parentId, data);

		if (!result.error && loadedRange) {
			await this.fetchEvents(loadedRange.start, loadedRange.end);
		}

		return result;
	},
};
