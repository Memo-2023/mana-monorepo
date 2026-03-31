/**
 * Event Drag & Drop + Resize Composable
 * Extracts duplicated drag/resize logic from WeekView, DayView, MultiDayView
 */

import type { CalendarEvent } from '@calendar/shared';
import { differenceInMinutes, addMinutes, setHours, setMinutes } from 'date-fns';
import { toDate } from '$lib/utils/eventDateHelpers';
import { eventsStore } from '$lib/stores/events.svelte';
import { formatTime, getDayFromX, getMinutesFromY } from '$lib/utils/drag-helpers';

export interface EventDragDropConfig {
	/** Reference to the container element for position calculations */
	containerEl: HTMLElement | null;
	/** Array of visible days (for multi-day views) or single day (for day view) */
	days: Date[];
	/** First visible hour (for filtered hours mode) */
	firstVisibleHour: number;
	/** Last visible hour (for filtered hours mode) */
	lastVisibleHour: number;
	/** Total visible hours */
	totalVisibleHours: number;
	/** Height of one hour in pixels */
	hourHeight: number;
	/** Minutes per snap interval (default: 15) */
	snapMinutes?: number;
	/** Function to convert minutes to percentage position */
	minutesToPercent: (minutes: number) => number;
}

export interface EventDragState {
	isDragging: boolean;
	draggedEvent: CalendarEvent | null;
	dragTargetDay: Date | null;
	dragPreviewTop: number;
	dragPreviewHeight: number;
	hasMoved: boolean;
}

export interface EventResizeState {
	isResizing: boolean;
	resizeEvent: CalendarEvent | null;
	resizeEdge: 'top' | 'bottom';
	resizePreviewTop: number;
	resizePreviewHeight: number;
}

export function useEventDragDrop(getConfig: () => EventDragDropConfig) {
	// ========== Drag State ==========
	let isDragging = $state(false);
	let draggedEvent = $state<CalendarEvent | null>(null);
	let dragOffsetMinutes = $state(0);
	let dragTargetDay = $state<Date | null>(null);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);

	// ========== Resize State ==========
	let isResizing = $state(false);
	let resizeEvent = $state<CalendarEvent | null>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeOriginalStart = $state<Date | null>(null);
	let resizeOriginalEnd = $state<Date | null>(null);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);
	let resizeOffsetMinutes = $state(0);

	// Track if we actually moved during drag/resize (to prevent click on simple mousedown/up)
	let hasMoved = $state(false);

	// ========== Helper Functions ==========

	function dayFromX(clientX: number): Date | null {
		const config = getConfig();
		return getDayFromX(clientX, config.containerEl, config.days);
	}

	function minutesFromY(clientY: number): number {
		const config = getConfig();
		return getMinutesFromY(
			clientY,
			config.containerEl,
			config.totalVisibleHours,
			config.hourHeight,
			config.firstVisibleHour,
			config.snapMinutes
		);
	}

	// ========== Drag Functions ==========

	function startDrag(event: CalendarEvent, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const config = getConfig();

		isDragging = true;
		draggedEvent = event;
		hasMoved = false;

		const start = toDate(event.startTime);
		const end = toDate(event.endTime);
		const duration = differenceInMinutes(end, start);

		// Calculate initial preview position
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		dragPreviewTop = config.minutesToPercent(startMinutes);
		dragPreviewHeight = (duration / (config.totalVisibleHours * 60)) * 100;
		dragTargetDay = start;

		// Calculate offset from event start to click position
		const clickMinutes = minutesFromY(e.clientY);
		dragOffsetMinutes = clickMinutes - startMinutes;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;

		const config = getConfig();
		hasMoved = true;

		// Calculate new position
		const newDay = dayFromX(e.clientX);
		const newMinutes = minutesFromY(e.clientY) - dragOffsetMinutes;

		// Clamp to valid range
		const clampedMinutes = Math.max(
			config.firstVisibleHour * 60,
			Math.min(config.lastVisibleHour * 60 - 15, newMinutes)
		);

		// Update preview
		dragPreviewTop = config.minutesToPercent(clampedMinutes);
		if (newDay) {
			dragTargetDay = newDay;
		}
	}

	async function handleDragEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);

		if (!isDragging || !draggedEvent || !dragTargetDay || !hasMoved) {
			cleanupDrag();
			return;
		}

		const start = toDate(draggedEvent.startTime);
		const end = toDate(draggedEvent.endTime);
		const duration = differenceInMinutes(end, start);

		// Calculate new start time
		const newMinutes = minutesFromY(e.clientY) - dragOffsetMinutes;
		const clampedMinutes = Math.max(0, Math.min(24 * 60 - 15, newMinutes));
		const newHours = Math.floor(clampedMinutes / 60);
		const newMins = clampedMinutes % 60;

		let newStart = new Date(dragTargetDay);
		newStart = setHours(newStart, newHours);
		newStart = setMinutes(newStart, newMins);

		const newEnd = addMinutes(newStart, duration);

		// Update event via store
		if (eventsStore.isDraftEvent(draggedEvent.id)) {
			eventsStore.updateDraftEvent({
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		} else {
			await eventsStore.updateEvent(draggedEvent.id, {
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		}

		cleanupDrag();
	}

	function cleanupDrag() {
		isDragging = false;
		draggedEvent = null;
		dragTargetDay = null;
		hasMoved = false;
	}

	// ========== Resize Functions ==========

	function startResize(event: CalendarEvent, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const config = getConfig();

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
		const endMinutes = end.getHours() * 60 + end.getMinutes();
		const duration = differenceInMinutes(end, start);
		resizePreviewTop = config.minutesToPercent(startMinutes);
		resizePreviewHeight = (duration / (config.totalVisibleHours * 60)) * 100;

		// Calculate offset between snapped click position and actual event boundary
		const clickMinutes = minutesFromY(e.clientY);
		if (edge === 'top') {
			resizeOffsetMinutes = clickMinutes - startMinutes;
		} else {
			resizeOffsetMinutes = clickMinutes - endMinutes;
		}

		document.addEventListener('pointermove', handleResizeMove);
		document.addEventListener('pointerup', handleResizeEnd);
	}

	function handleResizeMove(e: PointerEvent) {
		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd) return;

		const config = getConfig();
		hasMoved = true;

		const currentMinutes = minutesFromY(e.clientY);
		// Apply offset to prevent jumping when drag starts
		const adjustedMinutes = currentMinutes - resizeOffsetMinutes;
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		if (resizeEdge === 'bottom') {
			// Resize from bottom - change end time
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(config.lastVisibleHour * 60, adjustedMinutes)
			);
			const newDuration = newEndMinutes - originalStartMinutes;
			resizePreviewHeight = (newDuration / (config.totalVisibleHours * 60)) * 100;
		} else {
			// Resize from top - change start time
			const newStartMinutes = Math.max(
				config.firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, adjustedMinutes)
			);
			const newDuration = originalEndMinutes - newStartMinutes;
			resizePreviewTop = config.minutesToPercent(newStartMinutes);
			resizePreviewHeight = (newDuration / (config.totalVisibleHours * 60)) * 100;
		}
	}

	async function handleResizeEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);

		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd || !hasMoved) {
			cleanupResize();
			return;
		}

		const config = getConfig();
		const currentMinutes = minutesFromY(e.clientY);
		// Apply offset to prevent jumping
		const adjustedMinutes = currentMinutes - resizeOffsetMinutes;
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		let newStart = resizeOriginalStart;
		let newEnd = resizeOriginalEnd;

		if (resizeEdge === 'bottom') {
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(config.lastVisibleHour * 60, adjustedMinutes)
			);
			const newHours = Math.floor(newEndMinutes / 60);
			const newMins = newEndMinutes % 60;
			newEnd = setHours(new Date(resizeOriginalEnd), newHours);
			newEnd = setMinutes(newEnd, newMins);
		} else {
			const newStartMinutes = Math.max(
				config.firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, adjustedMinutes)
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

		cleanupResize();
	}

	function cleanupResize() {
		isResizing = false;
		resizeEvent = null;
		resizeOriginalStart = null;
		resizeOriginalEnd = null;
		resizeOffsetMinutes = 0;
		hasMoved = false;
	}

	// ========== Combined Cleanup ==========

	function cleanup() {
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);
		cleanupDrag();
		cleanupResize();
	}

	/**
	 * Cancel any active drag/resize operation (e.g., on Escape key)
	 */
	function cancel() {
		if (isDragging || isResizing) {
			cleanup();
		}
	}

	/**
	 * Get formatted time range during resize preview
	 */
	function getResizePreviewTime(): string {
		if (!resizeEvent || !resizeOriginalStart || !resizeOriginalEnd) return '';

		const config = getConfig();
		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		const previewStartMinutes =
			(resizePreviewTop / 100) * config.totalVisibleHours * 60 + config.firstVisibleHour * 60;
		const previewEndMinutes =
			previewStartMinutes + (resizePreviewHeight / 100) * config.totalVisibleHours * 60;

		let startMin: number;
		let endMin: number;

		if (resizeEdge === 'top') {
			startMin = Math.round(previewStartMinutes);
			endMin = origEndMinutes;
		} else {
			startMin = origStartMinutes;
			endMin = Math.round(previewEndMinutes);
		}

		return `${formatTime(Math.floor(startMin / 60), startMin % 60)} - ${formatTime(Math.floor(endMin / 60), endMin % 60)}`;
	}

	return {
		// Drag state (reactive getters)
		get isDragging() {
			return isDragging;
		},
		get draggedEvent() {
			return draggedEvent;
		},
		get dragTargetDay() {
			return dragTargetDay;
		},
		get dragPreviewTop() {
			return dragPreviewTop;
		},
		get dragPreviewHeight() {
			return dragPreviewHeight;
		},

		// Resize state (reactive getters)
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

		// Shared state
		get hasMoved() {
			return hasMoved;
		},

		// Reset hasMoved after click handling
		resetHasMoved() {
			hasMoved = false;
		},

		// Methods
		startDrag,
		startResize,
		cancel,
		cleanup,
		getResizePreviewTime,
	};
}
