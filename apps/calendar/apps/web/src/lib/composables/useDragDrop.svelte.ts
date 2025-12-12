/**
 * Drag & Drop Composable for Calendar Events
 * Extracts drag logic from WeekView/DayView for reusability
 */

import type { CalendarEvent } from '@calendar/shared';
import { parseISO, differenceInMinutes, addMinutes, setHours, setMinutes } from 'date-fns';
import { eventsStore } from '$lib/stores/events.svelte';

export interface DragDropConfig {
	/** Reference to the container element for position calculations */
	containerEl: HTMLElement | null;
	/** Array of visible days */
	days: Date[];
	/** First visible hour (for filtered hours mode) */
	firstVisibleHour: number;
	/** Last visible hour (for filtered hours mode) */
	lastVisibleHour: number;
	/** Height of one hour in pixels */
	hourHeight: number;
	/** Minutes per snap interval */
	snapMinutes?: number;
}

export interface DragState {
	isDragging: boolean;
	draggedEvent: CalendarEvent | null;
	dragTargetDay: Date | null;
	dragPreviewTop: number;
	dragPreviewHeight: number;
	hasMoved: boolean;
}

export function useDragDrop(getConfig: () => DragDropConfig) {
	// State
	let isDragging = $state(false);
	let draggedEvent = $state<CalendarEvent | null>(null);
	let dragOffsetMinutes = $state(0);
	let dragTargetDay = $state<Date | null>(null);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);
	let hasMoved = $state(false);

	// Derived values
	const totalVisibleHours = $derived(() => {
		const config = getConfig();
		return config.lastVisibleHour - config.firstVisibleHour;
	});

	/**
	 * Convert minutes to percentage position (accounting for hidden hours)
	 */
	function minutesToPercent(minutes: number): number {
		const config = getConfig();
		const adjustedMinutes = minutes - config.firstVisibleHour * 60;
		return (adjustedMinutes / (totalVisibleHours() * 60)) * 100;
	}

	/**
	 * Get day from X coordinate
	 */
	function getDayFromX(clientX: number): Date | null {
		const config = getConfig();
		if (!config.containerEl) return null;

		const rect = config.containerEl.getBoundingClientRect();
		const relativeX = clientX - rect.left;
		const dayWidth = rect.width / config.days.length;
		const dayIndex = Math.floor(relativeX / dayWidth);

		if (dayIndex >= 0 && dayIndex < config.days.length) {
			return config.days[dayIndex];
		}
		return null;
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

		// Account for hidden early hours
		const visibleMinutes =
			(relativeY / (totalVisibleHours() * config.hourHeight)) * totalVisibleHours() * 60;
		const totalMinutes = visibleMinutes + config.firstVisibleHour * 60;

		// Snap to interval
		const snapMinutes = config.snapMinutes ?? 15;
		return Math.round(totalMinutes / snapMinutes) * snapMinutes;
	}

	/**
	 * Start dragging an event
	 */
	function startDrag(event: CalendarEvent, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const config = getConfig();
		isDragging = true;
		draggedEvent = event;
		hasMoved = false;

		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
		const duration = differenceInMinutes(end, start);

		// Calculate initial preview position
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		dragPreviewTop = minutesToPercent(startMinutes);
		dragPreviewHeight = (duration / (totalVisibleHours() * 60)) * 100;
		dragTargetDay = start;

		// Calculate offset from event start to click position
		const clickMinutes = getMinutesFromY(e.clientY);
		dragOffsetMinutes = clickMinutes - startMinutes;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;

		const config = getConfig();
		hasMoved = true;

		// Calculate new position
		const newDay = getDayFromX(e.clientX);
		const newMinutes = getMinutesFromY(e.clientY) - dragOffsetMinutes;

		// Clamp to valid range
		const clampedMinutes = Math.max(
			config.firstVisibleHour * 60,
			Math.min(config.lastVisibleHour * 60 - 15, newMinutes)
		);

		// Update preview
		dragPreviewTop = minutesToPercent(clampedMinutes);
		if (newDay) {
			dragTargetDay = newDay;
		}
	}

	async function handleDragEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);

		if (!isDragging || !draggedEvent || !dragTargetDay || !hasMoved) {
			cleanup();
			return;
		}

		const config = getConfig();
		const start =
			typeof draggedEvent.startTime === 'string'
				? parseISO(draggedEvent.startTime)
				: draggedEvent.startTime;
		const end =
			typeof draggedEvent.endTime === 'string'
				? parseISO(draggedEvent.endTime)
				: draggedEvent.endTime;
		const duration = differenceInMinutes(end, start);

		// Calculate new start time
		const newMinutes = getMinutesFromY(e.clientY) - dragOffsetMinutes;
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

		cleanup();
	}

	function cleanup() {
		isDragging = false;
		draggedEvent = null;
		dragTargetDay = null;
		hasMoved = false;
	}

	/**
	 * Cancel drag operation (e.g., on Escape key)
	 */
	function cancelDrag() {
		if (isDragging) {
			document.removeEventListener('pointermove', handleDragMove);
			document.removeEventListener('pointerup', handleDragEnd);
			cleanup();
		}
	}

	return {
		// State (reactive getters)
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
		get hasMoved() {
			return hasMoved;
		},

		// Methods
		startDrag,
		cancelDrag,
		minutesToPercent,
	};
}
