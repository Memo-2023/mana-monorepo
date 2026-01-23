/**
 * Events Store - Manages calendar events using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
import * as api from '$lib/api/events';
import { format, isWithinInterval, isSameDay } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { toastStore } from './toast.svelte';
import { sessionEventsStore } from './session-events.svelte';
import { authStore } from './auth.svelte';

// State
let events = $state<CalendarEvent[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let loadedRange = $state<{ start: Date; end: Date } | null>(null);

// Draft event for quick create (temporary event shown in grid before saving)
let draftEvent = $state<CalendarEvent | null>(null);

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
	 * In guest mode, only shows session events
	 */
	async fetchEvents(startDate: Date, endDate: Date, calendarIds?: string[]) {
		loading = true;
		error = null;

		// Guest mode: load session events only
		if (!authStore.isAuthenticated) {
			// Initialize session events store if needed
			sessionEventsStore.initialize();

			// Filter session events by date range
			const sessionEvents = sessionEventsStore.events.filter((event) => {
				const eventStart = toDate(event.startTime);
				const eventEnd = toDate(event.endTime);
				return eventStart <= endDate && eventEnd >= startDate;
			});

			events = sessionEvents;
			loadedRange = { start: startDate, end: endDate };
			loading = false;
			return { data: sessionEvents, error: null };
		}

		// Authenticated: fetch from API
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
			console.log('[Events Store] Loaded events:', eventsData?.length, eventsData);
			events = eventsData || [];
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
	 * If not authenticated, creates a session event (local only)
	 */
	async createEvent(data: CreateEventInput) {
		// Guest mode: create session event
		if (!authStore.isAuthenticated) {
			const sessionEvent = sessionEventsStore.createEvent({
				...data,
				calendarId: data.calendarId || 'session-calendar',
			});
			// Add to local events array for immediate display
			events = [...events, sessionEvent];
			toastStore.success('Termin erstellt (lokal gespeichert)');
			return { data: sessionEvent, error: null };
		}

		// Authenticated: create via API
		const result = await api.createEvent(data);

		if (result.data) {
			events = [...events, result.data];
		}

		return result;
	},

	/**
	 * Update an event
	 * Handles both session events (local) and cloud events
	 */
	async updateEvent(id: string, data: UpdateEventInput) {
		// Session event: update locally
		if (sessionEventsStore.isSessionEvent(id)) {
			const updated = sessionEventsStore.updateEvent(id, data);
			if (updated) {
				events = events.map((e) => (e.id === id ? updated : e));
				return { data: updated, error: null };
			}
			return { data: null, error: new Error('Event not found') };
		}

		// Cloud event: update via API
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
	 * Handles both session events (local) and cloud events
	 */
	async deleteEvent(id: string) {
		// Session event: delete locally
		if (sessionEventsStore.isSessionEvent(id)) {
			sessionEventsStore.deleteEvent(id);
			events = events.filter((e) => e.id !== id);
			toastStore.success('Termin gelöscht');
			return { data: null, error: null };
		}

		// Cloud event: delete via API
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
	 * Check if an event is a session event (local only)
	 */
	isSessionEvent(eventId: string) {
		return sessionEventsStore.isSessionEvent(eventId);
	},

	/**
	 * Migrate session events to cloud after login
	 * Call this after successful authentication
	 */
	async migrateSessionEvents(defaultCalendarId?: string) {
		const sessionEvents = sessionEventsStore.getAllEvents();
		if (sessionEvents.length === 0) return { migrated: 0, failed: 0 };

		let migrated = 0;
		let failed = 0;

		for (const sessionEvent of sessionEvents) {
			try {
				const result = await api.createEvent({
					calendarId: defaultCalendarId || sessionEvent.calendarId,
					title: sessionEvent.title,
					description: sessionEvent.description || undefined,
					location: sessionEvent.location || undefined,
					startTime: sessionEvent.startTime,
					endTime: sessionEvent.endTime,
					isAllDay: sessionEvent.isAllDay,
					color: sessionEvent.color || undefined,
				});

				if (result.data) {
					migrated++;
				} else {
					failed++;
				}
			} catch {
				failed++;
			}
		}

		// Clear session events after migration
		if (migrated > 0) {
			sessionEventsStore.clear();
			toastStore.success(
				`${migrated} ${migrated === 1 ? 'Termin' : 'Termine'} in die Cloud übernommen`
			);
		}

		return { migrated, failed };
	},

	/**
	 * Get count of pending session events
	 */
	get sessionEventCount() {
		return sessionEventsStore.count;
	},

	/**
	 * Check if there are pending session events to migrate
	 */
	get hasSessionEvents() {
		return sessionEventsStore.hasEvents;
	},
};
