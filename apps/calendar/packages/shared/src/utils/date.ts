/**
 * Date utility functions for calendar operations
 */

/**
 * Get the start of day for a given date
 */
export function startOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get the end of day for a given date
 */
export function endOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Get the start of week for a given date
 * @param date - The date
 * @param weekStartsOn - 0 = Sunday, 1 = Monday
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
	const result = new Date(date);
	const day = result.getDay();
	const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
	result.setDate(result.getDate() - diff);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get the end of week for a given date
 * @param date - The date
 * @param weekStartsOn - 0 = Sunday, 1 = Monday
 */
export function endOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
	const result = startOfWeek(date, weekStartsOn);
	result.setDate(result.getDate() + 6);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Get the start of month for a given date
 */
export function startOfMonth(date: Date): Date {
	const result = new Date(date);
	result.setDate(1);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get the end of month for a given date
 */
export function endOfMonth(date: Date): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + 1);
	result.setDate(0);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Get the start of year for a given date
 */
export function startOfYear(date: Date): Date {
	const result = new Date(date);
	result.setMonth(0, 1);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get the end of year for a given date
 */
export function endOfYear(date: Date): Date {
	const result = new Date(date);
	result.setMonth(11, 31);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
	return addDays(date, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
	const result = new Date(date);
	result.setFullYear(result.getFullYear() + years);
	return result;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
	return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
	return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
	return date.getTime() > Date.now();
}

/**
 * Get all days in a month as an array
 */
export function getDaysInMonth(year: number, month: number): Date[] {
	const days: Date[] = [];
	const date = new Date(year, month, 1);
	while (date.getMonth() === month) {
		days.push(new Date(date));
		date.setDate(date.getDate() + 1);
	}
	return days;
}

/**
 * Get the number of days in a month
 */
export function getMonthDayCount(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
	const startStr = start.toLocaleDateString();
	const endStr = end.toLocaleDateString();

	if (isSameDay(start, end)) {
		return startStr;
	}

	return `${startStr} - ${endStr}`;
}

/**
 * Format a time for display (HH:MM)
 */
export function formatTime(date: Date): string {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Parse an ISO date string to Date
 */
export function parseISODate(dateString: string | Date): Date {
	if (dateString instanceof Date) {
		return dateString;
	}
	return new Date(dateString);
}

/**
 * Get week number of the year (ISO 8601)
 */
export function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get an array of hours in a day (0-23)
 */
export function getHoursInDay(): number[] {
	return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Calculate event duration in minutes
 */
export function getEventDurationMinutes(start: Date, end: Date): number {
	return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
	start1: Date,
	end1: Date,
	start2: Date,
	end2: Date
): boolean {
	return start1 < end2 && end1 > start2;
}
