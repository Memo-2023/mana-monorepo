/**
 * Session Events Store - Temporary local events for guest users
 * Events are stored in sessionStorage and lost when the browser tab is closed
 */

import type { CalendarEvent } from '@calendar/shared';
import { browser } from '$app/environment';

const STORAGE_KEY = 'calendar-session-events';

// Generate a unique ID for session events
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load events from sessionStorage
function loadFromStorage(): CalendarEvent[] {
	if (!browser) return [];
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

// Save events to sessionStorage
function saveToStorage(events: CalendarEvent[]) {
	if (!browser) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events));
	} catch (e) {
		console.warn('Failed to save session events:', e);
	}
}

// State
let events = $state<CalendarEvent[]>(loadFromStorage());

export const sessionEventsStore = {
	get events() {
		return events;
	},

	get hasEvents() {
		return events.length > 0;
	},

	/**
	 * Initialize from sessionStorage (call on mount)
	 */
	initialize() {
		events = loadFromStorage();
	},

	/**
	 * Create a new session event
	 */
	createEvent(data: Partial<CalendarEvent>): CalendarEvent {
		const newEvent: CalendarEvent = {
			id: generateSessionId(),
			calendarId: data.calendarId || 'session-calendar',
			userId: 'guest',
			title: data.title || 'Neuer Termin',
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

		events = [...events, newEvent];
		saveToStorage(events);
		return newEvent;
	},

	/**
	 * Update a session event
	 */
	updateEvent(id: string, data: Partial<CalendarEvent>): CalendarEvent | null {
		const index = events.findIndex((e) => e.id === id);
		if (index === -1) return null;

		const updatedEvent = {
			...events[index],
			...data,
			updatedAt: new Date().toISOString(),
		};

		events = events.map((e) => (e.id === id ? updatedEvent : e));
		saveToStorage(events);
		return updatedEvent;
	},

	/**
	 * Delete a session event
	 */
	deleteEvent(id: string): boolean {
		const hadEvent = events.some((e) => e.id === id);
		events = events.filter((e) => e.id !== id);
		saveToStorage(events);
		return hadEvent;
	},

	/**
	 * Get event by ID
	 */
	getById(id: string): CalendarEvent | undefined {
		return events.find((e) => e.id === id);
	},

	/**
	 * Check if an event ID is a session event
	 */
	isSessionEvent(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all events (for migration to cloud on login)
	 */
	getAllEvents(): CalendarEvent[] {
		return [...events];
	},

	/**
	 * Clear all session events (after migration or on explicit clear)
	 */
	clear() {
		events = [];
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Get count of session events
	 */
	get count() {
		return events.length;
	},
};
