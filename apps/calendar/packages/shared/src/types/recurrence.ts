/**
 * Recurrence frequency (RFC 5545)
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Day of week (RFC 5545)
 */
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

/**
 * Parsed recurrence pattern
 */
export interface RecurrencePattern {
	/** Frequency of recurrence */
	frequency: RecurrenceFrequency;
	/** Interval between occurrences (e.g., every 2 weeks) */
	interval?: number;
	/** Days of the week (for WEEKLY frequency) */
	byDay?: Weekday[];
	/** Day of the month (for MONTHLY frequency) */
	byMonthDay?: number[];
	/** Month of the year (for YEARLY frequency) */
	byMonth?: number[];
	/** Number of occurrences (COUNT) */
	count?: number;
	/** End date of recurrence (UNTIL) */
	until?: Date | string;
}

/**
 * Common recurrence presets for UI
 */
export const RECURRENCE_PRESETS = [
	{ label: 'Does not repeat', value: null },
	{ label: 'Daily', value: 'FREQ=DAILY' },
	{ label: 'Weekly', value: 'FREQ=WEEKLY' },
	{ label: 'Every weekday (Mon-Fri)', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
	{ label: 'Monthly', value: 'FREQ=MONTHLY' },
	{ label: 'Yearly', value: 'FREQ=YEARLY' },
] as const;

export type RecurrencePreset = (typeof RECURRENCE_PRESETS)[number];

/**
 * Weekday labels for UI
 */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
	MO: 'Monday',
	TU: 'Tuesday',
	WE: 'Wednesday',
	TH: 'Thursday',
	FR: 'Friday',
	SA: 'Saturday',
	SU: 'Sunday',
};

/**
 * Short weekday labels for UI
 */
export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
	MO: 'Mon',
	TU: 'Tue',
	WE: 'Wed',
	TH: 'Thu',
	FR: 'Fri',
	SA: 'Sat',
	SU: 'Sun',
};
