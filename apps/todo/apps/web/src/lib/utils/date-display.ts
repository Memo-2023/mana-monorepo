import { format, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Format a due date for display.
 * Returns 'Heute' for today, 'Morgen' for tomorrow, or 'dd. MMM' (German locale) otherwise.
 */
export function formatDueDate(date: Date): string {
	if (isToday(date)) return 'Heute';
	if (isTomorrow(date)) return 'Morgen';
	return format(date, 'dd. MMM', { locale: de });
}

/**
 * Format a date string for use in an HTML date input (yyyy-MM-dd).
 * Returns empty string if no date is provided.
 */
export function formatDateForInput(dateString?: string | null): string {
	if (!dateString) return '';
	return format(new Date(dateString), 'yyyy-MM-dd');
}

/**
 * Convert an HTML date input value (yyyy-MM-dd) to an ISO string.
 * Returns null if the input is empty.
 */
export function dateInputToISO(dateString: string): string | null {
	return dateString ? new Date(dateString).toISOString() : null;
}
