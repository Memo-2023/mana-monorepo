/**
 * Heatmap Store - Manages heatmap visualization state for calendar views
 */

import { eventsStore } from './events.svelte';
import { viewStore } from './view.svelte';
import { format, eachDayOfInterval, differenceInMinutes } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { browser } from '$app/environment';

// Heatmap metric type
export type HeatmapMetric = 'events' | 'hours';

// Heatmap level (0-5)
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4 | 5;

// State
let enabled = $state(false);
let metric = $state<HeatmapMetric>('events');

// Load from localStorage
if (browser) {
	const savedEnabled = localStorage.getItem('calendar-heatmap-enabled');
	if (savedEnabled === 'true') {
		enabled = true;
	}
	const savedMetric = localStorage.getItem('calendar-heatmap-metric');
	if (savedMetric === 'events' || savedMetric === 'hours') {
		metric = savedMetric;
	}
}

// Daily counts cache - computed based on events and view range
let dailyEventCounts = $derived.by(() => {
	const counts = new Map<string, number>();
	const range = viewStore.viewRange;

	if (!range) return counts;

	// Get all days in the current view range (plus some buffer for carousel)
	try {
		const days = eachDayOfInterval({ start: range.start, end: range.end });

		for (const day of days) {
			const dayKey = format(day, 'yyyy-MM-dd');
			const dayEvents = eventsStore.getEventsForDay(day, false); // Don't include draft
			counts.set(dayKey, dayEvents.length);
		}
	} catch {
		// Invalid interval, return empty
	}

	return counts;
});

// Daily busy hours cache
let dailyBusyHours = $derived.by(() => {
	const hours = new Map<string, number>();
	const range = viewStore.viewRange;

	if (!range) return hours;

	try {
		const days = eachDayOfInterval({ start: range.start, end: range.end });

		for (const day of days) {
			const dayKey = format(day, 'yyyy-MM-dd');
			const dayEvents = eventsStore.getEventsForDay(day, false);

			let totalMinutes = 0;
			for (const event of dayEvents) {
				if (!event.isAllDay) {
					const start = toDate(event.startTime);
					const end = toDate(event.endTime);
					totalMinutes += differenceInMinutes(end, start);
				}
			}

			hours.set(dayKey, totalMinutes / 60);
		}
	} catch {
		// Invalid interval, return empty
	}

	return hours;
});

export const heatmapStore = {
	// Getters
	get enabled() {
		return enabled;
	},
	get metric() {
		return metric;
	},

	// Toggle heatmap on/off
	toggle() {
		enabled = !enabled;
		if (browser) {
			localStorage.setItem('calendar-heatmap-enabled', String(enabled));
		}
	},

	// Enable heatmap
	enable() {
		enabled = true;
		if (browser) {
			localStorage.setItem('calendar-heatmap-enabled', 'true');
		}
	},

	// Disable heatmap
	disable() {
		enabled = false;
		if (browser) {
			localStorage.setItem('calendar-heatmap-enabled', 'false');
		}
	},

	// Set metric type
	setMetric(newMetric: HeatmapMetric) {
		metric = newMetric;
		if (browser) {
			localStorage.setItem('calendar-heatmap-metric', newMetric);
		}
	},

	/**
	 * Get event count for a specific date
	 */
	getEventCount(date: Date): number {
		const dayKey = format(date, 'yyyy-MM-dd');
		return dailyEventCounts.get(dayKey) ?? 0;
	},

	/**
	 * Get busy hours for a specific date
	 */
	getBusyHours(date: Date): number {
		const dayKey = format(date, 'yyyy-MM-dd');
		return dailyBusyHours.get(dayKey) ?? 0;
	},

	/**
	 * Get heatmap level (0-5) for a specific date based on current metric
	 */
	getLevel(date: Date): HeatmapLevel {
		if (metric === 'events') {
			const count = this.getEventCount(date);
			if (count === 0) return 0;
			if (count <= 2) return 1;
			if (count <= 4) return 2;
			if (count <= 6) return 3;
			if (count <= 9) return 4;
			return 5;
		} else {
			// Hours metric
			const hours = this.getBusyHours(date);
			if (hours === 0) return 0;
			if (hours <= 1) return 1;
			if (hours <= 2) return 2;
			if (hours <= 4) return 3;
			if (hours <= 6) return 4;
			return 5;
		}
	},

	/**
	 * Get CSS class for heatmap level
	 */
	getLevelClass(date: Date): string {
		const level = this.getLevel(date);
		return level === 0 ? '' : `heatmap-${level}`;
	},

	/**
	 * Get display value for a date (count or hours depending on metric)
	 */
	getDisplayValue(date: Date): string {
		if (metric === 'events') {
			const count = this.getEventCount(date);
			return count > 0 ? String(count) : '';
		} else {
			const hours = this.getBusyHours(date);
			if (hours === 0) return '';
			return hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`;
		}
	},
};
