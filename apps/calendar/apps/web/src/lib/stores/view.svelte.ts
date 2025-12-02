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

// Import settings store for weekStartsOn
import { settingsStore } from './settings.svelte';

// State
let currentDate = $state(new Date());
let viewType = $state<CalendarViewType>('week');

// Derived state - uses weekStartsOn from settings
const viewRange = $derived.by(() => {
	const weekStartsOn = settingsStore.weekStartsOn;

	switch (viewType) {
		case 'day':
			return {
				start: startOfDay(currentDate),
				end: endOfDay(currentDate),
			};
		case '5day':
			return {
				start: startOfDay(currentDate),
				end: endOfDay(addDays(currentDate, 4)),
			};
		case 'week':
			return {
				start: startOfWeek(currentDate, { weekStartsOn }),
				end: endOfWeek(currentDate, { weekStartsOn }),
			};
		case '10day':
			return {
				start: startOfDay(currentDate),
				end: endOfDay(addDays(currentDate, 9)),
			};
		case '14day':
			return {
				start: startOfDay(currentDate),
				end: endOfDay(addDays(currentDate, 13)),
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
				start: startOfWeek(currentDate, { weekStartsOn }),
				end: endOfWeek(currentDate, { weekStartsOn }),
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
	 * Note: Most settings are now managed by settingsStore
	 */
	initialize() {
		if (!browser) return;

		// Initialize settings store first
		settingsStore.initialize();

		// Load view type from settings or localStorage (for backwards compatibility)
		const savedView = localStorage.getItem('calendar-view-type');
		if (savedView && ['day', '5day', 'week', '10day', '14day', 'month', 'year', 'agenda'].includes(savedView)) {
			viewType = savedView as CalendarViewType;
		} else {
			// Use default view from settings
			viewType = settingsStore.defaultView;
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
			case '5day':
				currentDate = subDays(currentDate, 5);
				break;
			case 'week':
				currentDate = subWeeks(currentDate, 1);
				break;
			case '10day':
				currentDate = subDays(currentDate, 10);
				break;
			case '14day':
				currentDate = subDays(currentDate, 14);
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
			case '5day':
				currentDate = addDays(currentDate, 5);
				break;
			case 'week':
				currentDate = addWeeks(currentDate, 1);
				break;
			case '10day':
				currentDate = addDays(currentDate, 10);
				break;
			case '14day':
				currentDate = addDays(currentDate, 14);
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
