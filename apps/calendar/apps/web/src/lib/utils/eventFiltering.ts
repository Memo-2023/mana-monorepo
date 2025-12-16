/**
 * Event Filtering Utilities
 * Reusable functions for filtering calendar events by visibility, time range, etc.
 */

import type { CalendarEvent } from '@calendar/shared';
import type { Calendar } from '@calendar/shared';
import { toDate } from './eventDateHelpers';

/**
 * Create a Set of visible calendar IDs for efficient lookup
 */
export function getVisibleCalendarIds(visibleCalendars: Calendar[]): Set<string> {
	return new Set(visibleCalendars.map((c) => c.id));
}

/**
 * Filter events to only include those from visible calendars
 */
export function filterByVisibleCalendars(
	events: CalendarEvent[],
	visibleCalendars: Calendar[]
): CalendarEvent[] {
	const visibleIds = getVisibleCalendarIds(visibleCalendars);
	return events.filter((e) => visibleIds.has(e.calendarId));
}

/**
 * Filter events to only include timed (non-all-day) events
 */
export function filterTimedEvents(events: CalendarEvent[]): CalendarEvent[] {
	return events.filter((e) => !e.isAllDay);
}

/**
 * Filter events to only include all-day events
 */
export function filterAllDayEvents(events: CalendarEvent[]): CalendarEvent[] {
	return events.filter((e) => e.isAllDay);
}

/**
 * Get event time in minutes from midnight
 */
export function getEventMinutes(event: CalendarEvent): { start: number; end: number } {
	const start = toDate(event.startTime);
	const end = toDate(event.endTime);
	return {
		start: start.getHours() * 60 + start.getMinutes(),
		end: end.getHours() * 60 + end.getMinutes(),
	};
}

/**
 * Check if an event overlaps with a given time range (in minutes from midnight)
 */
export function eventOverlapsTimeRange(
	event: CalendarEvent,
	startMinutes: number,
	endMinutes: number
): boolean {
	const { start: eventStart, end: eventEnd } = getEventMinutes(event);
	return eventStart < endMinutes && eventEnd > startMinutes;
}

/**
 * Filter timed events that overlap with a visible hour range
 */
export function filterByHourRange(
	events: CalendarEvent[],
	dayStartHour: number,
	dayEndHour: number
): CalendarEvent[] {
	const startMinutes = dayStartHour * 60;
	const endMinutes = dayEndHour * 60;
	return events.filter((event) => eventOverlapsTimeRange(event, startMinutes, endMinutes));
}

/**
 * Result type for overflow events
 */
export interface OverflowEvents {
	before: CalendarEvent[];
	after: CalendarEvent[];
}

/**
 * Get events that are outside the visible hour range
 * Returns events that end before the visible range starts (before)
 * and events that start after the visible range ends (after)
 */
export function getOverflowEvents(
	events: CalendarEvent[],
	dayStartHour: number,
	dayEndHour: number
): OverflowEvents {
	const startMinutes = dayStartHour * 60;
	const endMinutes = dayEndHour * 60;

	const before: CalendarEvent[] = [];
	const after: CalendarEvent[] = [];

	for (const event of events) {
		const { start: eventStart, end: eventEnd } = getEventMinutes(event);

		if (eventEnd <= startMinutes) {
			before.push(event);
		} else if (eventStart >= endMinutes) {
			after.push(event);
		}
	}

	return { before, after };
}

/**
 * Combined filter: Get visible timed events for a day with optional hour and tag filtering
 */
export function getVisibleTimedEvents(
	events: CalendarEvent[],
	visibleCalendars: Calendar[],
	options?: {
		filterHoursEnabled?: boolean;
		dayStartHour?: number;
		dayEndHour?: number;
		selectedTagIds?: string[];
	}
): CalendarEvent[] {
	let filtered = filterByVisibleCalendars(events, visibleCalendars);
	filtered = filterTimedEvents(filtered);

	if (
		options?.filterHoursEnabled &&
		options.dayStartHour !== undefined &&
		options.dayEndHour !== undefined
	) {
		filtered = filterByHourRange(filtered, options.dayStartHour, options.dayEndHour);
	}

	// Apply tag filter if tags are selected
	if (options?.selectedTagIds) {
		filtered = filterByTags(filtered, options.selectedTagIds);
	}

	return filtered;
}

/**
 * Combined filter: Get visible all-day events for a day with optional tag filtering
 */
export function getVisibleAllDayEvents(
	events: CalendarEvent[],
	visibleCalendars: Calendar[],
	options?: {
		selectedTagIds?: string[];
	}
): CalendarEvent[] {
	let filtered = filterByVisibleCalendars(events, visibleCalendars);
	filtered = filterAllDayEvents(filtered);

	// Apply tag filter if tags are selected
	if (options?.selectedTagIds) {
		filtered = filterByTags(filtered, options.selectedTagIds);
	}

	return filtered;
}

/**
 * Filter events by selected tag IDs
 * If no tags are selected (empty array), returns all events
 * If tags are selected, returns only events that have at least one of the selected tags
 */
export function filterByTags(events: CalendarEvent[], selectedTagIds: string[]): CalendarEvent[] {
	// If no tags are selected, show all events
	if (selectedTagIds.length === 0) {
		return events;
	}

	const selectedTagSet = new Set(selectedTagIds);

	return events.filter((event) => {
		// If event has no tags, don't show it when filtering by tags
		if (!event.tags || event.tags.length === 0) {
			return false;
		}

		// Check if event has at least one of the selected tags
		return event.tags.some((tag) => selectedTagSet.has(tag.id));
	});
}

/**
 * Combined filter: Get overflow events for visible calendars
 */
export function getVisibleOverflowEvents(
	events: CalendarEvent[],
	visibleCalendars: Calendar[],
	dayStartHour: number,
	dayEndHour: number
): OverflowEvents {
	let filtered = filterByVisibleCalendars(events, visibleCalendars);
	filtered = filterTimedEvents(filtered);
	return getOverflowEvents(filtered, dayStartHour, dayEndHour);
}
