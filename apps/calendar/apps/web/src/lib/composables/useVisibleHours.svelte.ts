/**
 * useVisibleHours Composable
 *
 * Provides hour filtering and time-to-position calculations for calendar views.
 * Extracts common logic from WeekView, MultiDayView, and DayView.
 */

import { settingsStore } from '$lib/stores/settings.svelte';

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Creates reactive hour visibility state and helper functions
 */
export function useVisibleHours() {
	// Filtered hours based on settings
	let hours = $derived(
		settingsStore.filterHoursEnabled
			? ALL_HOURS.filter((h) => h >= settingsStore.dayStartHour && h < settingsStore.dayEndHour)
			: ALL_HOURS
	);

	// Calculate visible hours range for positioning
	let firstVisibleHour = $derived(
		settingsStore.filterHoursEnabled ? settingsStore.dayStartHour : 0
	);

	let lastVisibleHour = $derived(settingsStore.filterHoursEnabled ? settingsStore.dayEndHour : 24);

	let totalVisibleHours = $derived(lastVisibleHour - firstVisibleHour);

	/**
	 * Convert minutes (from midnight) to percentage position
	 * accounting for hidden hours when filtering is enabled
	 */
	function minutesToPercent(minutes: number): number {
		const adjustedMinutes = minutes - firstVisibleHour * 60;
		return (adjustedMinutes / (totalVisibleHours * 60)) * 100;
	}

	/**
	 * Convert percentage position back to minutes (from midnight)
	 */
	function percentToMinutes(percent: number): number {
		return (percent / 100) * (totalVisibleHours * 60) + firstVisibleHour * 60;
	}

	/**
	 * Check if a time range overlaps with the visible hours range
	 */
	function isTimeRangeVisible(startMinutes: number, endMinutes: number): boolean {
		const visibleStartMinutes = firstVisibleHour * 60;
		const visibleEndMinutes = lastVisibleHour * 60;
		return startMinutes < visibleEndMinutes && endMinutes > visibleStartMinutes;
	}

	return {
		get hours() {
			return hours;
		},
		get firstVisibleHour() {
			return firstVisibleHour;
		},
		get lastVisibleHour() {
			return lastVisibleHour;
		},
		get totalVisibleHours() {
			return totalVisibleHours;
		},
		minutesToPercent,
		percentToMinutes,
		isTimeRangeVisible,
	};
}

/**
 * Creates a reactive current time indicator
 * Updates every minute and provides position calculation
 */
export function useCurrentTimeIndicator() {
	let now = $state(new Date());

	// Update current time every minute
	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000);
		return () => clearInterval(interval);
	});

	return {
		get now() {
			return now;
		},
		/**
		 * Get current time as minutes from midnight
		 */
		get currentMinutes() {
			return now.getHours() * 60 + now.getMinutes();
		},
	};
}
