/**
 * Task Drag & Drop + Resize Composable
 * Extracts duplicated task drag/resize logic from WeekView, DayView, MultiDayView
 *
 * Uses document-level event listeners for smooth drag operations across the entire screen.
 */

import type { Task } from '$lib/stores/todos.svelte';
import { todosStore } from '$lib/stores/todos.svelte';
import { format } from 'date-fns';
import { formatTime, getSnapMinutes } from '$lib/utils/drag-helpers';

export interface TaskDragDropConfig {
	/** Reference to the container element for position calculations */
	containerEl: HTMLElement | null;
	/** Array of visible days (for multi-day views) or single day (for day view) */
	days: Date[];
	/** First visible hour (for filtered hours mode) */
	firstVisibleHour: number;
	/** Total visible hours */
	totalVisibleHours: number;
	/** Minutes per snap interval (default: 15) */
	snapMinutes?: number;
}

export function useTaskDragDrop(getConfig: () => TaskDragDropConfig) {
	// ========== Drag State ==========
	let isTaskDragging = $state(false);
	let draggedTask = $state<Task | null>(null);
	let taskDragTargetDay = $state<Date | null>(null);
	let taskDragPreviewTop = $state(0);
	let taskDragPreviewHeight = $state(0);

	// ========== Resize State ==========
	let isTaskResizing = $state(false);
	let resizeTask = $state<Task | null>(null);
	let taskResizeEdge = $state<'top' | 'bottom'>('bottom');
	let taskResizePreviewTop = $state(0);
	let taskResizePreviewHeight = $state(0);

	// Track if we actually moved during drag/resize
	let hasMoved = $state(false);

	// ========== Helper Functions ==========

	// ========== Drag Functions ==========

	function startDrag(task: Task, e: PointerEvent) {
		e.preventDefault();

		const config = getConfig();
		isTaskDragging = true;
		draggedTask = task;
		hasMoved = false;

		// Initialize preview position from task's current time
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - config.firstVisibleHour * 60;
			taskDragPreviewTop = (startMinutes / (config.totalVisibleHours * 60)) * 100;
		}

		const duration = task.estimatedDuration || 30;
		taskDragPreviewHeight = (duration / (config.totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isTaskDragging || !draggedTask) return;

		const config = getConfig();
		hasMoved = true;

		// Find which day column we're over
		if (config.containerEl) {
			const dayColumns = config.containerEl.querySelectorAll('.day-column');
			for (let i = 0; i < dayColumns.length; i++) {
				const col = dayColumns[i];
				const rect = col.getBoundingClientRect();
				if (e.clientX >= rect.left && e.clientX <= rect.right) {
					taskDragTargetDay = config.days[i];
					break;
				}
			}
		}

		// Calculate vertical position
		const targetColumn = config.containerEl?.querySelector('.day-column');
		if (!targetColumn) return;

		const rect = targetColumn.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		// Snap to intervals
		const minutesPerPercent = (config.totalVisibleHours * 60) / 100;
		const rawMinutes = percentY * minutesPerPercent;
		const snapMinutes = getSnapMinutes(getConfig().snapMinutes);
		const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
		taskDragPreviewTop = (snappedMinutes / (config.totalVisibleHours * 60)) * 100;
	}

	async function handleDragEnd() {
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);

		if (!isTaskDragging || !draggedTask || !hasMoved) {
			cleanupDrag();
			return;
		}

		const config = getConfig();

		// Calculate new time from position
		const minutesFromStart = (taskDragPreviewTop / 100) * (config.totalVisibleHours * 60);
		const totalMinutes = config.firstVisibleHour * 60 + minutesFromStart;
		const hours = Math.floor(totalMinutes / 60);
		const minutes = Math.round(totalMinutes % 60);

		const newStartTime = formatTime(hours, minutes);

		// Calculate end time based on duration
		const duration = draggedTask.estimatedDuration || 30;
		const endTotalMinutes = totalMinutes + duration;
		const endHours = Math.floor(endTotalMinutes / 60);
		const endMins = Math.round(endTotalMinutes % 60);
		const newEndTime = formatTime(endHours, endMins);

		await todosStore.updateTodo(draggedTask.id, {
			scheduledDate: taskDragTargetDay ? format(taskDragTargetDay, 'yyyy-MM-dd') : undefined,
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
		});

		cleanupDrag();
	}

	function cleanupDrag() {
		isTaskDragging = false;
		draggedTask = null;
		taskDragTargetDay = null;
		hasMoved = false;
	}

	// ========== Resize Functions ==========

	function startResize(task: Task, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const config = getConfig();
		isTaskResizing = true;
		resizeTask = task;
		taskResizeEdge = edge;
		hasMoved = false;

		// Initialize preview position
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - config.firstVisibleHour * 60;
			taskResizePreviewTop = (startMinutes / (config.totalVisibleHours * 60)) * 100;
		}

		const duration = task.estimatedDuration || 30;
		taskResizePreviewHeight = (duration / (config.totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleResizeMove);
		document.addEventListener('pointerup', handleResizeEnd);
	}

	function handleResizeMove(e: PointerEvent) {
		if (!isTaskResizing || !resizeTask) return;

		const config = getConfig();
		hasMoved = true;

		const targetColumn = config.containerEl?.querySelector('.day-column');
		if (!targetColumn) return;

		const rect = targetColumn.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		const minutesPerPercent = (config.totalVisibleHours * 60) / 100;
		const snapMinutes = getSnapMinutes(getConfig().snapMinutes);

		if (taskResizeEdge === 'top') {
			// Adjust start time, keep end fixed
			const originalEndPercent = taskResizePreviewTop + taskResizePreviewHeight;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
			taskResizePreviewTop = (snappedMinutes / (config.totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, originalEndPercent - taskResizePreviewTop);
		} else {
			// Adjust end time, keep start fixed
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
			const newBottom = (snappedMinutes / (config.totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, newBottom - taskResizePreviewTop);
		}
	}

	async function handleResizeEnd() {
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);

		if (!isTaskResizing || !resizeTask || !hasMoved) {
			cleanupResize();
			return;
		}

		const config = getConfig();

		// Calculate new times from position
		const startMinutes =
			(taskResizePreviewTop / 100) * (config.totalVisibleHours * 60) + config.firstVisibleHour * 60;
		const endMinutes =
			((taskResizePreviewTop + taskResizePreviewHeight) / 100) * (config.totalVisibleHours * 60) +
			config.firstVisibleHour * 60;

		const startHours = Math.floor(startMinutes / 60);
		const startMins = Math.round(startMinutes % 60);
		const endHours = Math.floor(endMinutes / 60);
		const endMins = Math.round(endMinutes % 60);

		const newStartTime = formatTime(startHours, startMins);
		const newEndTime = formatTime(endHours, endMins);
		const newDuration = Math.round(endMinutes - startMinutes);

		await todosStore.updateTodo(resizeTask.id, {
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
			estimatedDuration: newDuration,
		});

		cleanupResize();
	}

	function cleanupResize() {
		isTaskResizing = false;
		resizeTask = null;
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
	 * Cancel any active drag/resize operation
	 */
	function cancel() {
		if (isTaskDragging || isTaskResizing) {
			cleanup();
		}
	}

	return {
		// Drag state (reactive getters)
		get isTaskDragging() {
			return isTaskDragging;
		},
		get draggedTask() {
			return draggedTask;
		},
		get taskDragTargetDay() {
			return taskDragTargetDay;
		},
		get taskDragPreviewTop() {
			return taskDragPreviewTop;
		},
		get taskDragPreviewHeight() {
			return taskDragPreviewHeight;
		},

		// Resize state (reactive getters)
		get isTaskResizing() {
			return isTaskResizing;
		},
		get resizeTask() {
			return resizeTask;
		},
		get taskResizeEdge() {
			return taskResizeEdge;
		},
		get taskResizePreviewTop() {
			return taskResizePreviewTop;
		},
		get taskResizePreviewHeight() {
			return taskResizePreviewHeight;
		},

		// Shared state
		get hasMoved() {
			return hasMoved;
		},

		// Methods
		startDrag,
		startResize,
		cancel,
		cleanup,
	};
}
