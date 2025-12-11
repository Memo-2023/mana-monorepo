/**
 * Composable for Task Drag & Drop in Calendar Views
 * Handles dragging tasks to reschedule and resizing to change duration
 */

import type { Task, UpdateTaskInput } from '$lib/api/todos';
import { todosStore } from '$lib/stores/todos.svelte';
import { format, parseISO, addMinutes, differenceInMinutes, setHours, setMinutes } from 'date-fns';

const SNAP_MINUTES = 15;

interface UseTaskDragDropOptions {
	/** Minimum snap interval in minutes */
	snapMinutes?: number;
	/** Callback when task is updated */
	onTaskUpdate?: (task: Task) => void;
}

export function useTaskDragDrop(options: UseTaskDragDropOptions = {}) {
	const snapMinutes = options.snapMinutes ?? SNAP_MINUTES;

	// Drag state
	let isDragging = $state(false);
	let draggedTask = $state<Task | null>(null);
	let dragStartY = $state(0);
	let dragTargetDay = $state<Date | null>(null);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);

	// Resize state
	let isResizing = $state(false);
	let resizeTask = $state<Task | null>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeStartY = $state(0);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);

	// Track if we actually moved
	let hasMoved = $state(false);

	/**
	 * Start dragging a task
	 */
	function startDrag(
		task: Task,
		e: PointerEvent,
		gridElement: HTMLElement,
		firstVisibleHour: number,
		totalVisibleHours: number
	) {
		e.preventDefault();
		isDragging = true;
		draggedTask = task;
		dragStartY = e.clientY;
		hasMoved = false;

		// Calculate initial position
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - firstVisibleHour * 60;
			dragPreviewTop = (startMinutes / (totalVisibleHours * 60)) * 100;
		}

		// Calculate height from duration
		const duration = task.estimatedDuration || 30;
		dragPreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		// Capture pointer
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	/**
	 * Handle drag move
	 */
	function onDragMove(
		e: PointerEvent,
		gridElement: HTMLElement,
		day: Date,
		firstVisibleHour: number,
		totalVisibleHours: number
	) {
		if (!isDragging || !draggedTask) return;

		hasMoved = true;
		dragTargetDay = day;

		const rect = gridElement.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = (relativeY / rect.height) * 100;

		// Snap to intervals
		const minutesPerPercent = (totalVisibleHours * 60) / 100;
		const rawMinutes = percentY * minutesPerPercent + firstVisibleHour * 60;
		const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;

		dragPreviewTop = ((snappedMinutes - firstVisibleHour * 60) / (totalVisibleHours * 60)) * 100;
	}

	/**
	 * End drag and update task
	 */
	async function endDrag(firstVisibleHour: number, totalVisibleHours: number) {
		if (!isDragging || !draggedTask || !hasMoved) {
			isDragging = false;
			draggedTask = null;
			dragTargetDay = null;
			return;
		}

		// Calculate new time from position
		const minutesFromMidnight =
			(dragPreviewTop / 100) * (totalVisibleHours * 60) + firstVisibleHour * 60;
		const hours = Math.floor(minutesFromMidnight / 60);
		const minutes = Math.round(minutesFromMidnight % 60);

		const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

		// Calculate end time based on duration
		const duration = draggedTask.estimatedDuration || 30;
		const endMinutes = minutesFromMidnight + duration;
		const endHours = Math.floor(endMinutes / 60);
		const endMins = Math.round(endMinutes % 60);
		const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

		const updateData: UpdateTaskInput = {
			scheduledDate: dragTargetDay
				? format(dragTargetDay, 'yyyy-MM-dd')
				: draggedTask.scheduledDate,
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
		};

		const result = await todosStore.updateTodo(draggedTask.id, updateData);
		if (result.data) {
			options.onTaskUpdate?.(result.data);
		}

		isDragging = false;
		draggedTask = null;
		dragTargetDay = null;
		hasMoved = false;
	}

	/**
	 * Start resizing a task
	 */
	function startResize(
		task: Task,
		edge: 'top' | 'bottom',
		e: PointerEvent,
		firstVisibleHour: number,
		totalVisibleHours: number
	) {
		e.preventDefault();
		e.stopPropagation();
		isResizing = true;
		resizeTask = task;
		resizeEdge = edge;
		resizeStartY = e.clientY;
		hasMoved = false;

		// Initialize preview position
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - firstVisibleHour * 60;
			resizePreviewTop = (startMinutes / (totalVisibleHours * 60)) * 100;
		}

		const duration = task.estimatedDuration || 30;
		resizePreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	/**
	 * Handle resize move
	 */
	function onResizeMove(
		e: PointerEvent,
		gridElement: HTMLElement,
		firstVisibleHour: number,
		totalVisibleHours: number
	) {
		if (!isResizing || !resizeTask) return;

		hasMoved = true;

		const rect = gridElement.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		const minutesPerPercent = (totalVisibleHours * 60) / 100;

		if (resizeEdge === 'top') {
			// Adjust start time, keep end fixed
			const originalEndPercent = resizePreviewTop + resizePreviewHeight;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
			resizePreviewTop = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			resizePreviewHeight = Math.max(2, originalEndPercent - resizePreviewTop);
		} else {
			// Adjust end time, keep start fixed
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
			const newBottom = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			resizePreviewHeight = Math.max(2, newBottom - resizePreviewTop);
		}
	}

	/**
	 * End resize and update task
	 */
	async function endResize(firstVisibleHour: number, totalVisibleHours: number) {
		if (!isResizing || !resizeTask || !hasMoved) {
			isResizing = false;
			resizeTask = null;
			return;
		}

		// Calculate new times from position
		const startMinutes =
			(resizePreviewTop / 100) * (totalVisibleHours * 60) + firstVisibleHour * 60;
		const endMinutes =
			((resizePreviewTop + resizePreviewHeight) / 100) * (totalVisibleHours * 60) +
			firstVisibleHour * 60;

		const startHours = Math.floor(startMinutes / 60);
		const startMins = Math.round(startMinutes % 60);
		const endHours = Math.floor(endMinutes / 60);
		const endMins = Math.round(endMinutes % 60);

		const newStartTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
		const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
		const newDuration = Math.round(endMinutes - startMinutes);

		const updateData: UpdateTaskInput = {
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
			estimatedDuration: newDuration,
		};

		const result = await todosStore.updateTodo(resizeTask.id, updateData);
		if (result.data) {
			options.onTaskUpdate?.(result.data);
		}

		isResizing = false;
		resizeTask = null;
		hasMoved = false;
	}

	/**
	 * Cancel any ongoing drag/resize
	 */
	function cancel() {
		isDragging = false;
		isResizing = false;
		draggedTask = null;
		resizeTask = null;
		dragTargetDay = null;
		hasMoved = false;
	}

	return {
		// State getters
		get isDragging() {
			return isDragging;
		},
		get draggedTask() {
			return draggedTask;
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
		get isResizing() {
			return isResizing;
		},
		get resizeTask() {
			return resizeTask;
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
		startDrag,
		onDragMove,
		endDrag,
		startResize,
		onResizeMove,
		endResize,
		cancel,
	};
}
