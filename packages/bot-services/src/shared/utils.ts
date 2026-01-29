/**
 * Utility functions for bot services
 */

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get ISO date string for today
 */
export function getTodayISO(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get date at start of day
 */
export function startOfDay(date: Date = new Date()): Date {
	const result = new Date(date);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Get date at end of day
 */
export function endOfDay(date: Date = new Date()): Date {
	const result = new Date(date);
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
 * Format date for German locale
 */
export function formatDateDE(date: Date, options?: Intl.DateTimeFormatOptions): string {
	return date.toLocaleDateString('de-DE', options);
}

/**
 * Format time for German locale
 */
export function formatTimeDE(date: Date): string {
	return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
	const tomorrow = addDays(new Date(), 1);
	return (
		date.getDate() === tomorrow.getDate() &&
		date.getMonth() === tomorrow.getMonth() &&
		date.getFullYear() === tomorrow.getFullYear()
	);
}

/**
 * Parse German date keywords
 */
export function parseGermanDateKeyword(keyword: string): Date | null {
	const lower = keyword.toLowerCase().trim();
	const today = startOfDay();

	switch (lower) {
		case 'heute':
			return today;
		case 'morgen':
			return addDays(today, 1);
		case 'übermorgen':
			return addDays(today, 2);
		default:
			return null;
	}
}

/**
 * Get relative date label in German
 */
export function getRelativeDateLabel(date: Date): string {
	if (isToday(date)) return 'Heute';
	if (isTomorrow(date)) return 'Morgen';
	return formatDateDE(date, { weekday: 'short', day: '2-digit', month: '2-digit' });
}
