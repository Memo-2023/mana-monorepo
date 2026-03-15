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
	subWeeks,
	subMonths,
} from 'date-fns';

// Import settings store for weekStartsOn
import { settingsStore } from './settings.svelte';

// Supported view types after cleanup
const SUPPORTED_VIEWS: CalendarViewType[] = ['week', 'month', 'agenda'];

// State
let currentDate = $state(new Date());
let viewType = $state<CalendarViewType>('week');

// Derived state - uses weekStartsOn from settings
const viewRange = $derived.by(() => {
	const weekStartsOn = settingsStore.weekStartsOn;

	switch (viewType) {
		case 'week':
			return {
				start: startOfWeek(currentDate, { weekStartsOn }),
				end: endOfWeek(currentDate, { weekStartsOn }),
			};
		case 'month':
			return {
				start: startOfMonth(currentDate),
				end: endOfMonth(currentDate),
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
		if (savedView && SUPPORTED_VIEWS.includes(savedView as CalendarViewType)) {
			viewType = savedView as CalendarViewType;
		} else {
			// Use default view from settings, fallback to 'week' if unsupported
			const defaultView = settingsStore.defaultView;
			viewType = SUPPORTED_VIEWS.includes(defaultView) ? defaultView : 'week';
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
		// Only allow supported view types
		if (!SUPPORTED_VIEWS.includes(type)) {
			type = 'week';
		}
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
			case 'week':
				currentDate = subWeeks(currentDate, 1);
				break;
			case 'month':
				currentDate = subMonths(currentDate, 1);
				break;
			case 'agenda':
				currentDate = subWeeks(currentDate, 1);
				break;
		}
	},

	/**
	 * Navigate to next period
	 */
	goToNext() {
		switch (viewType) {
			case 'week':
				currentDate = addWeeks(currentDate, 1);
				break;
			case 'month':
				currentDate = addMonths(currentDate, 1);
				break;
			case 'agenda':
				currentDate = addWeeks(currentDate, 1);
				break;
		}
	},
};
