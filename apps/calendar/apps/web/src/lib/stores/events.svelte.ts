/**
 * Events Store - Manages calendar events using Svelte 5 runes
 */

import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
import * as api from '$lib/api/events';
import { format, isWithinInterval, parseISO, isSameDay } from 'date-fns';

// State
let events = $state<CalendarEvent[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let loadedRange = $state<{ start: Date; end: Date } | null>(null);

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
		} else {
			// API returns { events: [...] }
			const data = result.data as { events: CalendarEvent[] } | null;
			events = data?.events || [];
			loadedRange = { start: startDate, end: endDate };
		}

		loading = false;
		return result;
	},

	/**
	 * Get events for a specific day
	 */
	getEventsForDay(date: Date) {
		// Safety check: ensure events is an array (Svelte 5 runes safety)
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		return currentEvents.filter((event) => {
			const eventStart =
				typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
			const eventEnd = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

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
	},

	/**
	 * Get events within a time range
	 */
	getEventsInRange(start: Date, end: Date) {
		// Safety check: ensure events is an array (Svelte 5 runes safety)
		const currentEvents = events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		return currentEvents.filter((event) => {
			const eventStart =
				typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
			const eventEnd = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

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
			// API returns { event: {...} }
			const responseData = result.data as { event: CalendarEvent };
			events = [...events, responseData.event];
		}

		return result;
	},

	/**
	 * Update an event
	 */
	async updateEvent(id: string, data: UpdateEventInput) {
		const result = await api.updateEvent(id, data);

		if (result.data) {
			// API returns { event: {...} }
			const responseData = result.data as { event: CalendarEvent };
			events = events.map((e) => (e.id === id ? responseData.event : e));
		}

		return result;
	},

	/**
	 * Delete an event
	 */
	async deleteEvent(id: string) {
		const result = await api.deleteEvent(id);

		if (!result.error) {
			events = events.filter((e) => e.id !== id);
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
};
