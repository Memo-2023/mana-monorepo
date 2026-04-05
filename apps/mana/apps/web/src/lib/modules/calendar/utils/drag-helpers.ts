/**
 * Shared drag/drop utility functions
 */

import { SNAP_INTERVAL_MINUTES } from './constants';

export function formatTime(hours: number, minutes: number): string {
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getSnapMinutes(snapMinutes?: number): number {
	return snapMinutes ?? SNAP_INTERVAL_MINUTES;
}

export function snapToGrid(minutes: number, snapMinutes?: number): number {
	const snap = getSnapMinutes(snapMinutes);
	return Math.round(minutes / snap) * snap;
}

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
