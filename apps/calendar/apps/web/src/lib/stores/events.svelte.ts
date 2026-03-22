/**
 * Events Store - Manages calendar events using Svelte 5 runes
 */

import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
import { parseRRule, generateOccurrences } from '@calendar/shared';
import * as api from '$lib/api/events';
import { format, isWithinInterval, isSameDay, differenceInMilliseconds } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { toastStore } from '@manacore/shared-ui';
import { CalendarEvents } from '@manacore/shared-utils/analytics';

// State
let events = $state<CalendarEvent[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let loadedRange = $state<{ start: Date; end: Date } | null>(null);

// Draft event for quick create (temporary event shown in grid before saving)
let draftEvent = $state<CalendarEvent | null>(null);

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
	 * Fetch events for a date range
	 */
	async fetchEvents(startDate: Date, endDate: Date, calendarIds?: string[]) {
		loading = true;
		error = null;

		const result = await api.getEvents({
			startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
			endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
			calendarIds,
		});

		if (result.error) {
			error = result.error.message;
			toastStore.error(`Termine konnten nicht geladen werden: ${result.error.message}`);
		} else {
			// API returns events array directly (already extracted in api/events.ts)
			const eventsData = result.data as CalendarEvent[] | null;
			// Expand recurring events into individual occurrences for the view range
			events = expandRecurringEvents(eventsData || [], startDate, endDate);
			loadedRange = { start: startDate, end: endDate };
		}

		loading = false;
		return result;
	},

	/**
	 * Get events for a specific day (including draft event)
	 */
	getEventsForDay(date: Date, includeDraft = true) {
		// Safety check: ensure events is an array (Svelte 5 runes safety)
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		const result = currentEvents.filter((event) => {
			const eventStart = toDate(event.startTime);
			const eventEnd = toDate(event.endTime);

			// For all-day events, check if day falls within event range
			if (event.isAllDay) {
				return (
					isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
					isSameDay(date, eventStart)
				);
			}

			// For timed events, check if event starts on this day
			return isSameDay(date, eventStart);
		});

		// Include draft event if it exists and is on this day
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
		// Safety check: ensure events is an array (Svelte 5 runes safety)
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		return currentEvents.filter((event) => {
			const eventStart = toDate(event.startTime);
			const eventEnd = toDate(event.endTime);

			// Check if event overlaps with the range
			return eventStart <= end && eventEnd >= start;
		});
	},

	/**
	 * Create a new event
	 */
	async createEvent(data: CreateEventInput) {
		const result = await api.createEvent(data);

		if (result.data) {
			events = [...events, result.data];
			CalendarEvents.eventCreated(!!data.recurrenceRule);
		}

		return result;
	},

	/**
	 * Update an event
	 */
	async updateEvent(id: string, data: UpdateEventInput) {
		const result = await api.updateEvent(id, data);

		if (result.error) {
			toastStore.error(`Termin konnte nicht aktualisiert werden: ${result.error.message}`);
		} else if (result.data) {
			events = events.map((e) => (e.id === id ? result.data! : e));
		}

		return result;
	},

	/**
	 * Delete an event (optimistic update)
	 */
	async deleteEvent(id: string) {
		// Optimistic: remove event immediately
		const eventToDelete = events.find((e) => e.id === id);
		events = events.filter((e) => e.id !== id);

		const result = await api.deleteEvent(id);

		if (result.error) {
			// Rollback: restore the event on error
			if (eventToDelete) {
				events = [...events, eventToDelete];
			}
			toastStore.error(`Termin konnte nicht gelöscht werden: ${result.error.message}`);
		} else {
			toastStore.success('Termin gelöscht');
		}

		return result;
	},

	/**
	 * Get event by ID
	 */
	getById(id: string) {
		// Safety check: ensure events is an array (Svelte 5 runes safety)
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

	/**
	 * Create a draft event (shown immediately in grid, not saved yet)
	 */
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

	/**
	 * Update the draft event (when user changes time by dragging)
	 */
	updateDraftEvent(data: Partial<CalendarEvent>) {
		if (draftEvent) {
			draftEvent = { ...draftEvent, ...data };
		}
	},

	/**
	 * Clear the draft event (on cancel or after saving)
	 */
	clearDraftEvent() {
		draftEvent = null;
	},

	/**
	 * Check if an event is the draft event
	 */
	isDraftEvent(eventId: string) {
		return eventId === '__draft__';
	},

	/**
	 * Check if an event ID is a recurrence occurrence
	 */
	isRecurrenceOccurrence(eventId: string) {
		return eventId.includes('__recurrence__');
	},

	/**
	 * Get the parent event ID from a recurrence occurrence ID
	 */
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
		const dateKey = eventId.split('__recurrence__')[1]; // yyyy-MM-dd

		// Find the parent event to get existing exceptions
		const parent = events.find(
			(e) => e.id === parentId || this.getParentEventId(e.id) === parentId
		);
		if (!parent) return { error: { message: 'Event not found' } };

		const realParentId = this.getParentEventId(parent.id);
		const existingExceptions = (parent.recurrenceExceptions as string[]) || [];
		const updatedExceptions = [...existingExceptions, dateKey];

		// Optimistic: remove this occurrence from local state
		events = events.filter((e) => e.id !== eventId);

		const result = await api.updateEvent(realParentId, {
			recurrenceExceptions: updatedExceptions as unknown as undefined,
		});

		if (result.error) {
			toastStore.error(`Fehler: ${result.error.message}`);
			// Refetch to restore state
			if (loadedRange) {
				this.fetchEvents(loadedRange.start, loadedRange.end);
			}
		} else {
			toastStore.success('Termin gelöscht');
		}

		return result;
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
		const result = await api.updateEvent(parentId, data);

		if (result.error) {
			toastStore.error(`Fehler: ${result.error.message}`);
		} else {
			// Refetch to regenerate occurrences
			if (loadedRange) {
				await this.fetchEvents(loadedRange.start, loadedRange.end);
			}
		}

		return result;
	},
};
