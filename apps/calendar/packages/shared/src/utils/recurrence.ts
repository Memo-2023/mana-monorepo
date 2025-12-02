import type { RecurrencePattern, RecurrenceFrequency, Weekday } from '../types/recurrence';
import { addDays, addWeeks, addMonths, addYears } from './date';

/**
 * Parse an RFC 5545 RRULE string to a RecurrencePattern object
 *
 * Example: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;UNTIL=20241231T235959Z"
 */
export function parseRRule(rrule: string): RecurrencePattern | null {
	if (!rrule || !rrule.startsWith('FREQ=')) {
		return null;
	}

	const parts = rrule.split(';');
	const pattern: RecurrencePattern = {
		frequency: 'DAILY',
	};

	for (const part of parts) {
		const [key, value] = part.split('=');

		switch (key) {
			case 'FREQ':
				if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
					pattern.frequency = value as RecurrenceFrequency;
				}
				break;

			case 'INTERVAL':
				pattern.interval = parseInt(value, 10);
				break;

			case 'BYDAY':
				pattern.byDay = value.split(',') as Weekday[];
				break;

			case 'BYMONTHDAY':
				pattern.byMonthDay = value.split(',').map((d) => parseInt(d, 10));
				break;

			case 'BYMONTH':
				pattern.byMonth = value.split(',').map((m) => parseInt(m, 10));
				break;

			case 'COUNT':
				pattern.count = parseInt(value, 10);
				break;

			case 'UNTIL':
				// Parse UNTIL date (format: YYYYMMDD or YYYYMMDDTHHMMSSZ)
				const year = parseInt(value.substring(0, 4), 10);
				const month = parseInt(value.substring(4, 6), 10) - 1;
				const day = parseInt(value.substring(6, 8), 10);
				pattern.until = new Date(year, month, day, 23, 59, 59);
				break;
		}
	}

	return pattern;
}

/**
 * Format a RecurrencePattern object to an RFC 5545 RRULE string
 */
export function formatRRule(pattern: RecurrencePattern): string {
	const parts: string[] = [`FREQ=${pattern.frequency}`];

	if (pattern.interval && pattern.interval > 1) {
		parts.push(`INTERVAL=${pattern.interval}`);
	}

	if (pattern.byDay && pattern.byDay.length > 0) {
		parts.push(`BYDAY=${pattern.byDay.join(',')}`);
	}

	if (pattern.byMonthDay && pattern.byMonthDay.length > 0) {
		parts.push(`BYMONTHDAY=${pattern.byMonthDay.join(',')}`);
	}

	if (pattern.byMonth && pattern.byMonth.length > 0) {
		parts.push(`BYMONTH=${pattern.byMonth.join(',')}`);
	}

	if (pattern.count) {
		parts.push(`COUNT=${pattern.count}`);
	}

	if (pattern.until) {
		const date = new Date(pattern.until);
		const until = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T235959Z`;
		parts.push(`UNTIL=${until}`);
	}

	return parts.join(';');
}

/**
 * Get human-readable description of a recurrence pattern
 */
export function describeRecurrence(pattern: RecurrencePattern | null): string {
	if (!pattern) {
		return 'Does not repeat';
	}

	const interval = pattern.interval || 1;

	switch (pattern.frequency) {
		case 'DAILY':
			if (interval === 1) return 'Daily';
			return `Every ${interval} days`;

		case 'WEEKLY':
			if (pattern.byDay && pattern.byDay.length > 0) {
				if (pattern.byDay.length === 5 && !pattern.byDay.includes('SA') && !pattern.byDay.includes('SU')) {
					return interval === 1 ? 'Every weekday' : `Every ${interval} weeks on weekdays`;
				}
				const days = pattern.byDay.map(dayToLabel).join(', ');
				return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
			}
			return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;

		case 'MONTHLY':
			if (pattern.byMonthDay && pattern.byMonthDay.length > 0) {
				const days = pattern.byMonthDay.join(', ');
				return interval === 1 ? `Monthly on day ${days}` : `Every ${interval} months on day ${days}`;
			}
			return interval === 1 ? 'Monthly' : `Every ${interval} months`;

		case 'YEARLY':
			return interval === 1 ? 'Yearly' : `Every ${interval} years`;

		default:
			return 'Custom repeat';
	}
}

/**
 * Convert weekday code to label
 */
function dayToLabel(day: Weekday): string {
	const labels: Record<Weekday, string> = {
		MO: 'Mon',
		TU: 'Tue',
		WE: 'Wed',
		TH: 'Thu',
		FR: 'Fri',
		SA: 'Sat',
		SU: 'Sun',
	};
	return labels[day];
}

/**
 * Convert JavaScript day (0-6) to Weekday
 */
export function jsDateToWeekday(jsDay: number): Weekday {
	const weekdays: Weekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
	return weekdays[jsDay];
}

/**
 * Convert Weekday to JavaScript day (0-6)
 */
export function weekdayToJsDate(weekday: Weekday): number {
	const weekdays: Weekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
	return weekdays.indexOf(weekday);
}

/**
 * Generate occurrences of a recurring event within a date range
 *
 * @param startDate - The start date of the first occurrence
 * @param pattern - The recurrence pattern
 * @param rangeStart - Start of the date range to generate occurrences for
 * @param rangeEnd - End of the date range
 * @param exceptions - Dates to exclude (as ISO strings)
 * @param maxOccurrences - Maximum number of occurrences to generate
 */
export function generateOccurrences(
	startDate: Date,
	pattern: RecurrencePattern,
	rangeStart: Date,
	rangeEnd: Date,
	exceptions: string[] = [],
	maxOccurrences: number = 365
): Date[] {
	const occurrences: Date[] = [];
	const exceptionsSet = new Set(exceptions);
	const interval = pattern.interval || 1;

	let currentDate = new Date(startDate);
	let count = 0;

	// Get the maximum end date (either pattern.until or rangeEnd)
	const maxDate = pattern.until
		? new Date(Math.min(new Date(pattern.until).getTime(), rangeEnd.getTime()))
		: rangeEnd;

	while (currentDate <= maxDate && count < maxOccurrences) {
		// Check if we've exceeded COUNT
		if (pattern.count && occurrences.length >= pattern.count) {
			break;
		}

		// Check if this date matches the pattern
		if (matchesPattern(currentDate, pattern)) {
			// Check if date is in range and not in exceptions
			if (currentDate >= rangeStart && !exceptionsSet.has(currentDate.toISOString().split('T')[0])) {
				occurrences.push(new Date(currentDate));
			}
		}

		// Move to next potential occurrence
		currentDate = getNextOccurrence(currentDate, pattern.frequency, interval);
		count++;
	}

	return occurrences;
}

/**
 * Check if a date matches the recurrence pattern constraints
 */
function matchesPattern(date: Date, pattern: RecurrencePattern): boolean {
	// Check BYDAY
	if (pattern.byDay && pattern.byDay.length > 0) {
		const dayOfWeek = jsDateToWeekday(date.getDay());
		if (!pattern.byDay.includes(dayOfWeek)) {
			return false;
		}
	}

	// Check BYMONTHDAY
	if (pattern.byMonthDay && pattern.byMonthDay.length > 0) {
		if (!pattern.byMonthDay.includes(date.getDate())) {
			return false;
		}
	}

	// Check BYMONTH
	if (pattern.byMonth && pattern.byMonth.length > 0) {
		if (!pattern.byMonth.includes(date.getMonth() + 1)) {
			return false;
		}
	}

	return true;
}

/**
 * Get the next occurrence date based on frequency
 */
function getNextOccurrence(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
	switch (frequency) {
		case 'DAILY':
			return addDays(date, interval);
		case 'WEEKLY':
			// For weekly, always move by 1 day to check each day of the week
			return addDays(date, 1);
		case 'MONTHLY':
			return addMonths(date, interval);
		case 'YEARLY':
			return addYears(date, interval);
		default:
			return addDays(date, 1);
	}
}
