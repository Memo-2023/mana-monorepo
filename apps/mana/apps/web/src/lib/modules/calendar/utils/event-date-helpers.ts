/**
 * Event Date Helpers
 */

import { parseISO } from 'date-fns';

export function toDate(value: string | Date): Date {
	return typeof value === 'string' ? parseISO(value) : value;
}

export function getEventStart(event: { startTime: string | Date }): Date {
	return toDate(event.startTime);
}

export function getEventEnd(event: { endTime: string | Date }): Date {
	return toDate(event.endTime);
}
