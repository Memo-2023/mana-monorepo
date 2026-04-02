/**
 * Shared drag/drop utility functions
 * Used by useEventDragDrop, useDragToCreate
 */

import { SNAP_INTERVAL_MINUTES } from '$lib/utils/calendarConstants';

/**
 * Format hours and minutes as HH:MM string
 */
export function formatTime(hours: number, minutes: number): string {
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get the effective snap interval, falling back to the default constant
 */
export function getSnapMinutes(snapMinutes?: number): number {
	return snapMinutes ?? SNAP_INTERVAL_MINUTES;
}

/**
 * Snap a minute value to the nearest grid interval
 */
export function snapToGrid(minutes: number, snapMinutes?: number): number {
	const snap = getSnapMinutes(snapMinutes);
	return Math.round(minutes / snap) * snap;
}

/**
 * Map an X client coordinate to a day column based on container width
 */
export function getDayFromX(
	clientX: number,
	containerEl: HTMLElement | null,
	days: Date[]
): Date | null {
	if (!containerEl) return null;

	const rect = containerEl.getBoundingClientRect();
	const relativeX = clientX - rect.left;
	const dayWidth = rect.width / days.length;
	const dayIndex = Math.floor(relativeX / dayWidth);

	if (dayIndex >= 0 && dayIndex < days.length) {
		return days[dayIndex];
	}
	return null;
}

/**
 * Map a Y client coordinate to total minutes in the day,
 * accounting for scroll offset, visible hour range, and snap interval
 */
export function getMinutesFromY(
	clientY: number,
	containerEl: HTMLElement | null,
	totalVisibleHours: number,
	hourHeight: number,
	firstVisibleHour: number,
	snapMinutes?: number
): number {
	if (!containerEl) return 0;

	const rect = containerEl.getBoundingClientRect();
	const scrollTop = containerEl.parentElement?.scrollTop || 0;
	const relativeY = clientY - rect.top + scrollTop;

	const visibleMinutes = (relativeY / (totalVisibleHours * hourHeight)) * totalVisibleHours * 60;
	const totalMinutes = visibleMinutes + firstVisibleHour * 60;

	return snapToGrid(totalMinutes, snapMinutes);
}
