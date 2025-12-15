/**
 * Resize Composable for Calendar Events
 * Extracts resize logic from WeekView/DayView for reusability
 */

import type { CalendarEvent } from '@calendar/shared';
import { differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { eventsStore } from '$lib/stores/events.svelte';

export interface ResizeConfig {
	/** Reference to the container element for position calculations */
	containerEl: HTMLElement | null;
	/** First visible hour (for filtered hours mode) */
	firstVisibleHour: number;
	/** Last visible hour (for filtered hours mode) */
	lastVisibleHour: number;
	/** Height of one hour in pixels */
	hourHeight: number;
	/** Minutes per snap interval */
	snapMinutes?: number;
}

export interface ResizeState {
	isResizing: boolean;
	resizeEvent: CalendarEvent | null;
	resizeEdge: 'top' | 'bottom';
	resizePreviewTop: number;
	resizePreviewHeight: number;
	hasMoved: boolean;
}

export function useResize(getConfig: () => ResizeConfig) {
	// State
	let isResizing = $state(false);
	let resizeEvent = $state<CalendarEvent | null>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeOriginalStart = $state<Date | null>(null);
	let resizeOriginalEnd = $state<Date | null>(null);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);
	let hasMoved = $state(false);

	// Derived values
	const totalVisibleHours = $derived(() => {
		const config = getConfig();
		return config.lastVisibleHour - config.firstVisibleHour;
	});

	/**
	 * Convert minutes to percentage position
	 */
	function minutesToPercent(minutes: number): number {
		const config = getConfig();
		const adjustedMinutes = minutes - config.firstVisibleHour * 60;
		return (adjustedMinutes / (totalVisibleHours() * 60)) * 100;
	}

	/**
	 * Get minutes from Y coordinate
	 */
	function getMinutesFromY(clientY: number): number {
		const config = getConfig();
		if (!config.containerEl) return 0;

		const rect = config.containerEl.getBoundingClientRect();
		const scrollTop = config.containerEl.parentElement?.scrollTop || 0;
		const relativeY = clientY - rect.top + scrollTop;

		const visibleMinutes =
			(relativeY / (totalVisibleHours() * config.hourHeight)) * totalVisibleHours() * 60;
		const totalMinutes = visibleMinutes + config.firstVisibleHour * 60;

		const snapMinutes = config.snapMinutes ?? 15;
		return Math.round(totalMinutes / snapMinutes) * snapMinutes;
	}

	/**
	 * Start resizing an event
	 */
	function startResize(event: CalendarEvent, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		isResizing = true;
		resizeEvent = event;
		resizeEdge = edge;
		hasMoved = false;

		const start = toDate(event.startTime);
		const end = toDate(event.endTime);

		resizeOriginalStart = start;
		resizeOriginalEnd = end;

		// Set initial preview
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);
		resizePreviewTop = minutesToPercent(startMinutes);
		resizePreviewHeight = (duration / (totalVisibleHours() * 60)) * 100;

		document.addEventListener('pointermove', handleResizeMove);
		document.addEventListener('pointerup', handleResizeEnd);
	}

	function handleResizeMove(e: PointerEvent) {
		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd) return;

		const config = getConfig();
		hasMoved = true;

		const currentMinutes = getMinutesFromY(e.clientY);
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		if (resizeEdge === 'bottom') {
			// Resize from bottom - change end time
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(config.lastVisibleHour * 60, currentMinutes)
			);
			const newDuration = newEndMinutes - originalStartMinutes;
			resizePreviewHeight = (newDuration / (totalVisibleHours() * 60)) * 100;
		} else {
			// Resize from top - change start time
			const newStartMinutes = Math.max(
				config.firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, currentMinutes)
			);
			const newDuration = originalEndMinutes - newStartMinutes;
			resizePreviewTop = minutesToPercent(newStartMinutes);
			resizePreviewHeight = (newDuration / (totalVisibleHours() * 60)) * 100;
		}
	}

	async function handleResizeEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);

		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd || !hasMoved) {
			cleanup();
			return;
		}

		const config = getConfig();
		const currentMinutes = getMinutesFromY(e.clientY);
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		let newStart = resizeOriginalStart;
		let newEnd = resizeOriginalEnd;

		if (resizeEdge === 'bottom') {
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(config.lastVisibleHour * 60, currentMinutes)
			);
			const newHours = Math.floor(newEndMinutes / 60);
			const newMins = newEndMinutes % 60;
			newEnd = setHours(new Date(resizeOriginalEnd), newHours);
			newEnd = setMinutes(newEnd, newMins);
		} else {
			const newStartMinutes = Math.max(
				config.firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, currentMinutes)
			);
			const newHours = Math.floor(newStartMinutes / 60);
			const newMins = newStartMinutes % 60;
			newStart = setHours(new Date(resizeOriginalStart), newHours);
			newStart = setMinutes(newStart, newMins);
		}

		// Update event via store
		if (eventsStore.isDraftEvent(resizeEvent.id)) {
			eventsStore.updateDraftEvent({
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		} else {
			await eventsStore.updateEvent(resizeEvent.id, {
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		}

		cleanup();
	}

	function cleanup() {
		isResizing = false;
		resizeEvent = null;
		resizeOriginalStart = null;
		resizeOriginalEnd = null;
		hasMoved = false;
	}

	/**
	 * Cancel resize operation
	 */
	function cancelResize() {
		if (isResizing) {
			document.removeEventListener('pointermove', handleResizeMove);
			document.removeEventListener('pointerup', handleResizeEnd);
			cleanup();
		}
	}

	return {
		// State (reactive getters)
		get isResizing() {
			return isResizing;
		},
		get resizeEvent() {
			return resizeEvent;
		},
		get resizeEdge() {
			return resizeEdge;
		},
		get resizePreviewTop() {
			return resizePreviewTop;
		},
		get resizePreviewHeight() {
			return resizePreviewHeight;
		},
		get hasMoved() {
			return hasMoved;
		},

		// Methods
		startResize,
		cancelResize,
		minutesToPercent,
	};
}
