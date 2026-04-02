/**
 * Event Date Helpers
 * Utilities for consistent date handling across the calendar app
 */

import { parseISO } from 'date-fns';

/**
 * Convert a date value that may be either a string or Date to a Date object
 * This handles the common pattern where API returns ISO strings but we need Date objects
 */
export function toDate(value: string | Date): Date {
	return typeof value === 'string' ? parseISO(value) : value;
}

/**
 * Get the start time of an event as a Date object
 */
export function getEventStart(event: { startTime: string | Date }): Date {
	return toDate(event.startTime);
}

/**
 * Get the end time of an event as a Date object
 */
export function getEventEnd(event: { endTime: string | Date }): Date {
	return toDate(event.endTime);
}

/**
 * Get both start and end times of an event as Date objects
 */
export function getEventTimes(event: { startTime: string | Date; endTime: string | Date }): {
	start: Date;
	end: Date;
} {
	return {
		start: toDate(event.startTime),
		end: toDate(event.endTime),
	};
}
