/**
 * Date Navigation Utilities
 * Helper functions for calculating date offsets based on view type
 */

import type { CalendarViewType } from '@calendar/shared';
import {
	addDays,
	addWeeks,
	addMonths,
	addYears,
	subDays,
	subWeeks,
	subMonths,
	subYears,
} from 'date-fns';
import { settingsStore } from '$lib/stores/settings.svelte';

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
		case 'day':
			return offset > 0 ? addDays(date, offset) : subDays(date, Math.abs(offset));

		case '3day':
			return offset > 0 ? addDays(date, offset * 3) : subDays(date, Math.abs(offset) * 3);

		case '5day':
			return offset > 0 ? addDays(date, offset * 5) : subDays(date, Math.abs(offset) * 5);

		case 'week':
			return offset > 0 ? addWeeks(date, offset) : subWeeks(date, Math.abs(offset));

		case '10day':
			return offset > 0 ? addDays(date, offset * 10) : subDays(date, Math.abs(offset) * 10);

		case '14day':
			return offset > 0 ? addDays(date, offset * 14) : subDays(date, Math.abs(offset) * 14);

		case '30day':
			return offset > 0 ? addDays(date, offset * 30) : subDays(date, Math.abs(offset) * 30);

		case '60day':
			return offset > 0 ? addDays(date, offset * 60) : subDays(date, Math.abs(offset) * 60);

		case '90day':
			return offset > 0 ? addDays(date, offset * 90) : subDays(date, Math.abs(offset) * 90);

		case '365day':
			return offset > 0 ? addDays(date, offset * 365) : subDays(date, Math.abs(offset) * 365);

		case 'custom': {
			const days = settingsStore.customDayCount;
			return offset > 0 ? addDays(date, offset * days) : subDays(date, Math.abs(offset) * days);
		}

		case 'month':
			return offset > 0 ? addMonths(date, offset) : subMonths(date, Math.abs(offset));

		case 'year':
			return offset > 0 ? addYears(date, offset) : subYears(date, Math.abs(offset));

		case 'agenda':
			// Agenda moves by 7 days
			return offset > 0 ? addDays(date, offset * 7) : subDays(date, Math.abs(offset) * 7);

		default:
			return offset > 0 ? addWeeks(date, offset) : subWeeks(date, Math.abs(offset));
	}
}
