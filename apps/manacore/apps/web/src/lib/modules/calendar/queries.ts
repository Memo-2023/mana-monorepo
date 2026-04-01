/**
 * Reactive Queries & Pure Helpers for Calendar module.
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { liveQuery } from 'dexie';
import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalCalendar, LocalEvent, Calendar, CalendarEvent } from './types';
import { isSameDay, isWithinInterval, differenceInMilliseconds, format } from 'date-fns';

// ─── Type Converters ───────────────────────────────────────

export function toCalendar(local: LocalCalendar): Calendar {
	return {
		id: local.id,
		name: local.name,
		color: local.color,
		isDefault: local.isDefault,
		isVisible: local.isVisible,
		timezone: local.timezone,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toCalendarEvent(local: LocalEvent): CalendarEvent {
	return {
		id: local.id,
		calendarId: local.calendarId,
		title: local.title,
		description: local.description ?? null,
		location: local.location ?? null,
		startTime: local.startDate,
		endTime: local.endDate,
		isAllDay: local.allDay,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		recurrenceRule: local.recurrenceRule ?? null,
		parentEventId: null,
		color: local.color ?? null,
		tagIds: local.tagIds ?? [],
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Raw Observable Queries (for Svelte $ auto-subscribe) ──

export function allCalendars$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCalendar>('calendars').toArray();
		return locals.filter((c) => !c.deletedAt).map(toCalendar);
	});
}

export function allEvents$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalEvent>('events').toArray();
		return locals.filter((e) => !e.deletedAt).map(toCalendarEvent);
	});
}

// ─── Svelte 5 Reactive Hooks (call during component init) ──

/** All calendars, auto-updates on any change. */
export function useAllCalendars() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalCalendar>('calendars').toArray();
		return locals.filter((c) => !c.deletedAt).map(toCalendar);
	}, [] as Calendar[]);
}

/** All events, auto-updates on any change. */
export function useAllEvents() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalEvent>('events').toArray();
		return locals.filter((e) => !e.deletedAt).map(toCalendarEvent);
	}, [] as CalendarEvent[]);
}

// ─── Pure Calendar Helpers ─────────────────────────────────

/** Get visible calendars (where isVisible is true). */
export function getVisibleCalendars(calendars: Calendar[]): Calendar[] {
	return calendars.filter((c) => c.isVisible);
}

/** Get the default calendar, falling back to the first calendar. */
export function getDefaultCalendar(calendars: Calendar[]): Calendar | null {
	return calendars.find((c) => c.isDefault) || calendars[0] || null;
}

/** Get a calendar by ID. */
export function getCalendarById(calendars: Calendar[], id: string): Calendar | undefined {
	return calendars.find((c) => c.id === id);
}

/** Get a calendar's color by ID, with fallback. */
export function getCalendarColor(calendars: Calendar[], id: string): string {
	const calendar = calendars.find((c) => c.id === id);
	return calendar?.color || '#3b82f6';
}

// ─── Pure Event Helpers ────────────────────────────────────

/** Get an event by ID. */
export function getEventById(events: CalendarEvent[], id: string): CalendarEvent | undefined {
	return events.find((e) => e.id === id);
}

/** Convert a date string or Date to a Date. */
function toDate(dateStr: string | Date): Date {
	return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
}

/**
 * Get events for a specific day.
 */
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
	return events.filter((event) => {
		const eventStart = toDate(event.startTime);
		const eventEnd = toDate(event.endTime);

		if (event.isAllDay) {
			return (
				isWithinInterval(date, { start: eventStart, end: eventEnd }) || isSameDay(date, eventStart)
			);
		}

		return isSameDay(date, eventStart);
	});
}

/**
 * Get events within a time range.
 */
export function getEventsInRange(events: CalendarEvent[], start: Date, end: Date): CalendarEvent[] {
	return events.filter((event) => {
		const eventStart = toDate(event.startTime);
		const eventEnd = toDate(event.endTime);
		return eventStart <= end && eventEnd >= start;
	});
}

/**
 * Filter events by visible calendars.
 */
export function filterEventsByVisibleCalendars(
	events: CalendarEvent[],
	calendars: Calendar[]
): CalendarEvent[] {
	const visibleIds = new Set(calendars.filter((c) => c.isVisible).map((c) => c.id));
	return events.filter((e) => visibleIds.has(e.calendarId));
}

/**
 * Sort events by start time.
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
	return [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);
}
