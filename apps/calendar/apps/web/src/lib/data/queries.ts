/**
 * Reactive Queries & Pure Filter Helpers for Calendar
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	calendarCollection,
	eventCollection,
	type LocalCalendar,
	type LocalEvent,
} from './local-store';
import type { Calendar, CalendarEvent } from '@calendar/shared';
import { parseRRule, generateOccurrences } from '@calendar/shared';
import { isSameDay, isWithinInterval, differenceInMilliseconds, format } from 'date-fns';
import { BIRTHDAY_CALENDAR } from '$lib/api/birthdays';

// ─── Type Converters ───────────────────────────────────────

/** Convert a LocalCalendar (IndexedDB) to the shared Calendar type. */
export function toCalendar(local: LocalCalendar): Calendar {
	return {
		id: local.id,
		userId: 'guest',
		name: local.name,
		color: local.color,
		isDefault: local.isDefault,
		isVisible: local.isVisible,
		timezone: local.timezone,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert a LocalEvent (IndexedDB) to the shared CalendarEvent type. */
export function toCalendarEvent(local: LocalEvent): CalendarEvent {
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

// ─── Live Query Hooks (call during component init) ─────────

/** All calendars. Auto-updates on any change. */
export function useAllCalendars() {
	return useLiveQueryWithDefault(async () => {
		const locals = await calendarCollection.getAll();
		return locals.map(toCalendar);
	}, [] as Calendar[]);
}

/** All events. Auto-updates on any change. */
export function useAllEvents() {
	return useLiveQueryWithDefault(async () => {
		const locals = await eventCollection.getAll();
		return locals.map(toCalendarEvent);
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

/** Get a calendar's color by ID, with birthday calendar support and fallback. */
export function getCalendarColorWithBirthdays(calendars: Calendar[], id: string): string {
	if (id === BIRTHDAY_CALENDAR.id) {
		return BIRTHDAY_CALENDAR.color;
	}
	return getCalendarColor(calendars, id);
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
 * Expand recurring events into individual occurrences for a given range.
 * Each occurrence gets a synthetic ID: `{parentId}__recurrence__{dateISO}`
 */
export function expandRecurringEvents(
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

/**
 * Get events for a specific date range, including recurrence expansion.
 */
export function getEventsForRange(
	allEvents: CalendarEvent[],
	rangeStart: Date,
	rangeEnd: Date
): CalendarEvent[] {
	// Filter to events that overlap the range
	const inRange = allEvents.filter((event) => {
		const eventStart = toDate(event.startTime);
		const eventEnd = toDate(event.endTime);
		return eventStart <= rangeEnd && eventEnd >= rangeStart;
	});

	// Also include recurring events that might generate occurrences in range
	const recurring = allEvents.filter((event) => event.recurrenceRule && !inRange.includes(event));

	return expandRecurringEvents([...inRange, ...recurring], rangeStart, rangeEnd);
}

/**
 * Get events for a specific day (pure helper, no draft support).
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
