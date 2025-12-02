/**
 * View Store - Manages calendar view state using Svelte 5 runes
 */

import { browser } from '$app/environment';
import type { CalendarViewType } from '@calendar/shared';
import {
	startOfDay,
	startOfWeek,
	startOfMonth,
	endOfDay,
	endOfWeek,
	endOfMonth,
	addDays,
	addWeeks,
	addMonths,
	addYears,
	subDays,
	subWeeks,
	subMonths,
	subYears,
} from 'date-fns';

// State
let currentDate = $state(new Date());
let viewType = $state<CalendarViewType>('week');

// Derived state
const viewRange = $derived.by(() => {
	switch (viewType) {
		case 'day':
			return {
				start: startOfDay(currentDate),
				end: endOfDay(currentDate),
			};
		case 'week':
			return {
				start: startOfWeek(currentDate, { weekStartsOn: 1 }),
				end: endOfWeek(currentDate, { weekStartsOn: 1 }),
			};
		case 'month':
			return {
				start: startOfMonth(currentDate),
				end: endOfMonth(currentDate),
			};
		case 'year':
			return {
				start: new Date(currentDate.getFullYear(), 0, 1),
				end: new Date(currentDate.getFullYear(), 11, 31),
			};
		case 'agenda':
			// Agenda shows 30 days from current date
			return {
				start: startOfDay(currentDate),
				end: endOfDay(addDays(currentDate, 30)),
			};
		default:
			return {
				start: startOfWeek(currentDate, { weekStartsOn: 1 }),
				end: endOfWeek(currentDate, { weekStartsOn: 1 }),
			};
	}
});

export const viewStore = {
	// Getters
	get currentDate() {
		return currentDate;
	},
	get viewType() {
		return viewType;
	},
	get viewRange() {
		return viewRange;
	},

	/**
	 * Initialize view state from localStorage
	 */
	initialize() {
		if (!browser) return;

		const savedView = localStorage.getItem('calendar-view-type');
		if (savedView && ['day', 'week', 'month', 'year', 'agenda'].includes(savedView)) {
			viewType = savedView as CalendarViewType;
		}
	},

	/**
	 * Set the current date
	 */
	setDate(date: Date) {
		currentDate = date;
	},

	/**
	 * Set the view type
	 */
	setViewType(type: CalendarViewType) {
		viewType = type;
		if (browser) {
			localStorage.setItem('calendar-view-type', type);
		}
	},

	/**
	 * Navigate to today
	 */
	goToToday() {
		currentDate = new Date();
	},

	/**
	 * Navigate to previous period
	 */
	goToPrevious() {
		switch (viewType) {
			case 'day':
				currentDate = subDays(currentDate, 1);
				break;
			case 'week':
				currentDate = subWeeks(currentDate, 1);
				break;
			case 'month':
				currentDate = subMonths(currentDate, 1);
				break;
			case 'year':
				currentDate = subYears(currentDate, 1);
				break;
			case 'agenda':
				currentDate = subDays(currentDate, 7);
				break;
		}
	},

	/**
	 * Navigate to next period
	 */
	goToNext() {
		switch (viewType) {
			case 'day':
				currentDate = addDays(currentDate, 1);
				break;
			case 'week':
				currentDate = addWeeks(currentDate, 1);
				break;
			case 'month':
				currentDate = addMonths(currentDate, 1);
				break;
			case 'year':
				currentDate = addYears(currentDate, 1);
				break;
			case 'agenda':
				currentDate = addDays(currentDate, 7);
				break;
		}
	},
};
