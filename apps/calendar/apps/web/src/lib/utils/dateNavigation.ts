/**
 * Date Navigation Utilities
 * Helper functions for calculating date offsets based on view type
 */

import type { CalendarViewType } from '@calendar/shared';
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';

/**
 * Calculate a date offset based on the current view type
 *
 * @param date - The base date
 * @param viewType - The current calendar view type
 * @param offset - Number of periods to offset (-1 = previous, 1 = next)
 * @returns The calculated date
 *
 * @example
 * // Get previous week's date
 * getOffsetDate(new Date(), 'week', -1)
 *
 * // Get next month's date
 * getOffsetDate(new Date(), 'month', 1)
 */
export function getOffsetDate(date: Date, viewType: CalendarViewType, offset: number): Date {
	switch (viewType) {
		case 'week':
			return offset > 0 ? addWeeks(date, offset) : subWeeks(date, Math.abs(offset));

		case 'month':
			return offset > 0 ? addMonths(date, offset) : subMonths(date, Math.abs(offset));

		case 'agenda':
			// Agenda moves by 7 days
			return offset > 0 ? addDays(date, offset * 7) : subDays(date, Math.abs(offset) * 7);

		default:
			return offset > 0 ? addWeeks(date, offset) : subWeeks(date, Math.abs(offset));
	}
}
