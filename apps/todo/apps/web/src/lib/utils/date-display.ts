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
