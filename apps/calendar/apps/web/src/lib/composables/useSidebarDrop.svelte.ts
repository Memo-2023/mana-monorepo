/**
 * Sidebar Task Drop Composable
 * Handles dropping tasks from sidebar into calendar day columns
 */

import { todosStore } from '$lib/stores/todos.svelte';
import { format } from 'date-fns';
import { formatTime, getSnapMinutes } from '$lib/utils/drag-helpers';

export interface SidebarDropConfig {
	/** First visible hour (for filtered hours mode) */
	firstVisibleHour: number;
	/** Total visible hours */
	totalVisibleHours: number;
	/** Minutes per snap interval (default: 15) */
	snapMinutes?: number;
}

export function useSidebarDrop(getConfig: () => SidebarDropConfig) {
	// Track active drop target (for visual feedback)
	let dropTarget = $state<{ day: Date; y: number } | null>(null);

	/**
	 * Handle dragover event on a day column
	 */
	function handleDragOver(e: DragEvent, day: Date) {
		e.preventDefault();
		if (!e.dataTransfer) return;

		// Check if this is a sidebar task drag
		const types = e.dataTransfer.types;
		if (!types.includes('application/json')) return;

		e.dataTransfer.dropEffect = 'move';
		dropTarget = { day, y: e.clientY };
	}

	/**
	 * Handle dragleave event
	 */
	function handleDragLeave(e: DragEvent) {
		// Only clear if leaving the column entirely
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!relatedTarget?.closest('.day-column')) {
			dropTarget = null;
		}
	}

	/**
	 * Handle drop event on a day column
	 */
	async function handleDrop(e: DragEvent, day: Date) {
		e.preventDefault();
		dropTarget = null;

		if (!e.dataTransfer) return;

		const jsonData = e.dataTransfer.getData('application/json');
		if (!jsonData) return;

		try {
			const data = JSON.parse(jsonData);
			if (data.type !== 'sidebar-task') return;

			const config = getConfig();

			// Calculate drop time from Y position
			const dayColumn = (e.target as HTMLElement).closest('.day-column');
			if (!dayColumn) return;

			const rect = dayColumn.getBoundingClientRect();
			const relativeY = e.clientY - rect.top;
			const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

			const minutesPerPercent = (config.totalVisibleHours * 60) / 100;
			const rawMinutes = percentY * minutesPerPercent;
			const snapMinutes = getSnapMinutes(getConfig().snapMinutes);
			const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
			const totalMinutes = config.firstVisibleHour * 60 + snappedMinutes;

			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			const startTime = formatTime(hours, minutes);

			// Calculate end time
			const duration = data.estimatedDuration || 30;
			const endMinutes = totalMinutes + duration;
			const endHours = Math.floor(endMinutes / 60);
			const endMins = endMinutes % 60;
			const endTime = formatTime(endHours, endMins);

			// Update the task with scheduled time
			await todosStore.updateTodo(data.taskId, {
				scheduledDate: format(day, 'yyyy-MM-dd'),
				scheduledStartTime: startTime,
				scheduledEndTime: endTime,
				estimatedDuration: duration,
			});
		} catch (err) {
			console.error('Failed to parse drop data:', err);
		}
	}

	/**
	 * Clear drop target (use when component unmounts or for manual cleanup)
	 */
	function clearDropTarget() {
		dropTarget = null;
	}

	return {
		// State (reactive getter)
		get dropTarget() {
			return dropTarget;
		},

		// Methods
		handleDragOver,
		handleDragLeave,
		handleDrop,
		clearDropTarget,
	};
}
