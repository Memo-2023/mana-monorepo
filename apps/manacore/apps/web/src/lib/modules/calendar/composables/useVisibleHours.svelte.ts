/**
 * useVisibleHours + useCurrentTimeIndicator composables
 * Provides hour filtering and time-to-position calculations.
 */

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

export function useVisibleHours() {
	// No hour filtering in manacore yet — show all 24 hours
	const firstVisibleHour = 0;
	const lastVisibleHour = 24;
	const totalVisibleHours = 24;

	function minutesToPercent(minutes: number): number {
		const adjustedMinutes = minutes - firstVisibleHour * 60;
		return (adjustedMinutes / (totalVisibleHours * 60)) * 100;
	}

	function percentToMinutes(percent: number): number {
		return (percent / 100) * (totalVisibleHours * 60) + firstVisibleHour * 60;
	}

	return {
		get hours() {
			return ALL_HOURS;
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
	};
}

export function useCurrentTimeIndicator() {
	let now = $state(new Date());

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
		get currentMinutes() {
			return now.getHours() * 60 + now.getMinutes();
		},
	};
}
