<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { todosStore, type Task } from '$lib/stores/todos.svelte';
	import TaskBlock from './TaskBlock.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		eachDayOfInterval,
		startOfDay,
		isToday,
		isWeekend,
		isSameDay,
		parseISO,
		differenceInMinutes,
		addMinutes,
		setHours,
		setMinutes,
		getWeek,
	} from 'date-fns';
	import { de, enUS, fr, es, it } from 'date-fns/locale';
	import { locale, _ } from 'svelte-i18n';

	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
		onEventClick?: (event: CalendarEvent) => void;
		onTaskClick?: (task: Task) => void;
	}

	let { onQuickCreate, onEventClick, onTaskClick }: Props = $props();

	// Constants
	const HOUR_HEIGHT = 60; // px - should match CSS --hour-height
	const MINUTES_PER_SLOT = 15; // Snap to 15-minute intervals

	// Get date-fns locale based on current app locale
	const dateLocales = { de, en: enUS, fr, es, it };
	let currentDateLocale = $derived(
		dateLocales[$locale?.substring(0, 2) as keyof typeof dateLocales] || de
	);

	// Generate days of the week, optionally filtering weekends
	let allDays = $derived(
		eachDayOfInterval({
			start: viewStore.viewRange.start,
			end: viewStore.viewRange.end,
		})
	);

	let days = $derived(
		settingsStore.showOnlyWeekdays ? allDays.filter((day) => !isWeekend(day)) : allDays
	);

	// Get week number for display
	let weekNumber = $derived(
		getWeek(viewStore.viewRange.start, { weekStartsOn: settingsStore.weekStartsOn })
	);

	// Generate hours (filtered based on settings)
	let allHours = Array.from({ length: 24 }, (_, i) => i);
	let hours = $derived(
		settingsStore.filterHoursEnabled
			? allHours.filter((h) => h >= settingsStore.dayStartHour && h < settingsStore.dayEndHour)
			: allHours
	);

	// Calculate visible hours range for positioning
	let firstVisibleHour = $derived(
		settingsStore.filterHoursEnabled ? settingsStore.dayStartHour : 0
	);
	let lastVisibleHour = $derived(settingsStore.filterHoursEnabled ? settingsStore.dayEndHour : 24);
	let totalVisibleHours = $derived(lastVisibleHour - firstVisibleHour);

	// Helper to convert minutes to percentage position (accounting for hidden hours)
	function minutesToPercent(minutes: number): number {
		const adjustedMinutes = minutes - firstVisibleHour * 60;
		return (adjustedMinutes / (totalVisibleHours * 60)) * 100;
	}

	// Current time indicator position
	let now = $state(new Date());
	let currentTimePosition = $derived.by(() => {
		const minutes = now.getHours() * 60 + now.getMinutes();
		return minutesToPercent(minutes);
	});

	// Update current time every minute
	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000);
		return () => clearInterval(interval);
	});

	// Drag & Drop State
	let isDragging = $state(false);
	let draggedEvent = $state<CalendarEvent | null>(null);
	let dragOffsetMinutes = $state(0);
	let dragTargetDay = $state<Date | null>(null);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);

	// Resize State
	let isResizing = $state(false);
	let resizeEvent = $state<CalendarEvent | null>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeOriginalStart = $state<Date | null>(null);
	let resizeOriginalEnd = $state<Date | null>(null);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);

	// Track if we actually moved during drag/resize (to prevent click on simple mousedown/up)
	let hasMoved = $state(false);

	// Task Drag & Drop State
	let isTaskDragging = $state(false);
	let draggedTask = $state<Task | null>(null);
	let taskDragTargetDay = $state<Date | null>(null);
	let taskDragPreviewTop = $state(0);
	let taskDragPreviewHeight = $state(0);

	// Task Resize State
	let isTaskResizing = $state(false);
	let resizeTask = $state<Task | null>(null);
	let taskResizeEdge = $state<'top' | 'bottom'>('bottom');
	let taskResizePreviewTop = $state(0);
	let taskResizePreviewHeight = $state(0);

	// Reference to the days container for position calculations
	let daysContainerEl: HTMLDivElement;

	function getEventsForDay(day: Date) {
		const allEvents = eventsStore.getEventsForDay(day).filter((e) => !e.isAllDay);

		// If hour filtering is enabled, only show events that overlap with visible range
		if (settingsStore.filterHoursEnabled) {
			const visibleStartMinutes = settingsStore.dayStartHour * 60;
			const visibleEndMinutes = settingsStore.dayEndHour * 60;

			return allEvents.filter((event) => {
				const start =
					typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
				const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

				const eventStartMinutes = start.getHours() * 60 + start.getMinutes();
				const eventEndMinutes = end.getHours() * 60 + end.getMinutes();

				// Event overlaps with visible range
				return eventStartMinutes < visibleEndMinutes && eventEndMinutes > visibleStartMinutes;
			});
		}

		return allEvents;
	}

	// Get events that are completely outside the visible time range
	function getOverflowEventsForDay(day: Date): { before: CalendarEvent[]; after: CalendarEvent[] } {
		if (!settingsStore.filterHoursEnabled) {
			return { before: [], after: [] };
		}

		const allEvents = eventsStore.getEventsForDay(day).filter((e) => !e.isAllDay);
		const before: CalendarEvent[] = [];
		const after: CalendarEvent[] = [];

		const visibleStartMinutes = settingsStore.dayStartHour * 60;
		const visibleEndMinutes = settingsStore.dayEndHour * 60;

		for (const event of allEvents) {
			const start =
				typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
			const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

			const eventStartMinutes = start.getHours() * 60 + start.getMinutes();
			const eventEndMinutes = end.getHours() * 60 + end.getMinutes();

			// Event ends before visible range starts
			if (eventEndMinutes <= visibleStartMinutes) {
				before.push(event);
			}
			// Event starts after visible range ends
			else if (eventStartMinutes >= visibleEndMinutes) {
				after.push(event);
			}
		}

		return { before, after };
	}

	function getAllDayEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).filter((e) => e.isAllDay);
	}

	// Get display mode for an event (per-event override takes precedence over global setting)
	function getEventDisplayMode(event: CalendarEvent): 'header' | 'block' {
		return (
			(event.metadata as { allDayDisplayMode?: 'header' | 'block' } | null)?.allDayDisplayMode ||
			settingsStore.allDayDisplayMode
		);
	}

	// Split all-day events by display mode
	function getHeaderAllDayEventsForDay(day: Date) {
		return getAllDayEventsForDay(day).filter((e) => getEventDisplayMode(e) === 'header');
	}

	function getBlockAllDayEventsForDay(day: Date) {
		return getAllDayEventsForDay(day).filter((e) => getEventDisplayMode(e) === 'block');
	}

	// Check if there are any all-day events to show in header
	let hasAnyHeaderAllDayEvents = $derived(
		days.some((day) => getHeaderAllDayEventsForDay(day).length > 0)
	);

	function getEventStyle(event: CalendarEvent) {
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 2); // Min 2% height

		const color = calendarsStore.getColor(event.calendarId);

		return `top: ${top}%; height: ${height}%; background-color: ${color};`;
	}

	/**
	 * Get style for a scheduled task (time-blocking)
	 */
	function getTaskStyle(task: Task): string {
		if (!task.scheduledStartTime) return '';

		// Parse HH:mm time
		const [startHour, startMin] = task.scheduledStartTime.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;

		// Calculate duration - use estimatedDuration or scheduledEndTime or default 30 min
		let duration = task.estimatedDuration || 30;
		if (task.scheduledEndTime) {
			const [endHour, endMin] = task.scheduledEndTime.split(':').map(Number);
			const endMinutes = endHour * 60 + endMin;
			duration = endMinutes - startMinutes;
		}

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 2);

		return `top: ${top}%; height: ${height}%;`;
	}

	/**
	 * Get scheduled tasks for a specific day
	 */
	function getScheduledTasksForDay(day: Date): Task[] {
		return todosStore.getScheduledTasksForDay(day);
	}

	function formatEventTime(date: Date | string): string {
		const d = typeof date === 'string' ? parseISO(date) : date;
		return settingsStore.formatTime(d);
	}

	function handleEventClick(event: CalendarEvent, e: MouseEvent) {
		// Don't navigate if we just finished dragging or resizing, or if we moved
		if (isDragging || isResizing || hasMoved) {
			e.preventDefault();
			e.stopPropagation();
			// Reset hasMoved after a short delay to allow for the next clean click
			setTimeout(() => {
				hasMoved = false;
			}, 100);
			return;
		}
		if (onEventClick) {
			onEventClick(event);
		} else {
			goto(`/?event=${event.id}`);
		}
	}

	function handleSlotClick(day: Date, hour: number, e: MouseEvent) {
		// Don't create new event if dragging
		if (isDragging || isResizing) return;

		const startTime = new Date(day);
		startTime.setHours(hour, 0, 0, 0);

		if (onQuickCreate) {
			onQuickCreate(startTime, { x: e.clientX, y: e.clientY });
		} else {
			goto(`/event/new?start=${startTime.toISOString()}`);
		}
	}

	// ========== Drag & Drop Functions ==========

	function getDayFromX(clientX: number): Date | null {
		if (!daysContainerEl) return null;

		const rect = daysContainerEl.getBoundingClientRect();
		const relativeX = clientX - rect.left;
		const dayWidth = rect.width / days.length;
		const dayIndex = Math.floor(relativeX / dayWidth);

		if (dayIndex >= 0 && dayIndex < days.length) {
			return days[dayIndex];
		}
		return null;
	}

	function getMinutesFromY(clientY: number): number {
		if (!daysContainerEl) return 0;

		const rect = daysContainerEl.getBoundingClientRect();
		const scrollTop = daysContainerEl.parentElement?.scrollTop || 0;
		const relativeY = clientY - rect.top + scrollTop;
		// Account for hidden early hours
		const visibleMinutes = (relativeY / (totalVisibleHours * HOUR_HEIGHT)) * totalVisibleHours * 60;
		const totalMinutes = visibleMinutes + firstVisibleHour * 60;

		// Snap to 15-minute intervals
		return Math.round(totalMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
	}

	function startDrag(event: CalendarEvent, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		isDragging = true;
		draggedEvent = event;
		hasMoved = false;

		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
		const duration = differenceInMinutes(end, start);

		// Calculate initial preview position
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		dragPreviewTop = minutesToPercent(startMinutes);
		dragPreviewHeight = (duration / (totalVisibleHours * 60)) * 100;
		dragTargetDay = start;

		// Calculate offset from event start to click position
		const clickMinutes = getMinutesFromY(e.clientY);
		dragOffsetMinutes = clickMinutes - startMinutes;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;

		hasMoved = true;

		// Calculate new position
		const newDay = getDayFromX(e.clientX);
		const newMinutes = getMinutesFromY(e.clientY) - dragOffsetMinutes;

		// Clamp to valid range (firstVisibleHour to lastVisibleHour)
		const clampedMinutes = Math.max(
			firstVisibleHour * 60,
			Math.min(lastVisibleHour * 60 - 15, newMinutes)
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
			isDragging = false;
			draggedEvent = null;
			hasMoved = false;
			return;
		}

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

		// Update event via store (use updateDraftEvent for draft events)
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

		// Reset state
		isDragging = false;
		draggedEvent = null;
		dragTargetDay = null;
		hasMoved = false;
	}

	// ========== Resize Functions ==========

	function startResize(event: CalendarEvent, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		isResizing = true;
		resizeEvent = event;
		resizeEdge = edge;
		hasMoved = false;

		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		resizeOriginalStart = start;
		resizeOriginalEnd = end;

		// Set initial preview
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);
		resizePreviewTop = minutesToPercent(startMinutes);
		resizePreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleResizeMove);
		document.addEventListener('pointerup', handleResizeEnd);
	}

	function handleResizeMove(e: PointerEvent) {
		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd) return;

		hasMoved = true;
		const currentMinutes = getMinutesFromY(e.clientY);
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		if (resizeEdge === 'bottom') {
			// Resize from bottom - change end time
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(lastVisibleHour * 60, currentMinutes)
			);
			const newDuration = newEndMinutes - originalStartMinutes;
			resizePreviewHeight = (newDuration / (totalVisibleHours * 60)) * 100;
		} else {
			// Resize from top - change start time
			const newStartMinutes = Math.max(
				firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, currentMinutes)
			);
			const newDuration = originalEndMinutes - newStartMinutes;
			resizePreviewTop = minutesToPercent(newStartMinutes);
			resizePreviewHeight = (newDuration / (totalVisibleHours * 60)) * 100;
		}
	}

	async function handleResizeEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);

		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd || !hasMoved) {
			isResizing = false;
			resizeEvent = null;
			resizeOriginalStart = null;
			resizeOriginalEnd = null;
			hasMoved = false;
			return;
		}

		const currentMinutes = getMinutesFromY(e.clientY);
		const originalStartMinutes =
			resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const originalEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		let newStart = resizeOriginalStart;
		let newEnd = resizeOriginalEnd;

		if (resizeEdge === 'bottom') {
			const newEndMinutes = Math.max(
				originalStartMinutes + 15,
				Math.min(lastVisibleHour * 60, currentMinutes)
			);
			const newHours = Math.floor(newEndMinutes / 60);
			const newMins = newEndMinutes % 60;
			newEnd = setHours(new Date(resizeOriginalEnd), newHours);
			newEnd = setMinutes(newEnd, newMins);
		} else {
			const newStartMinutes = Math.max(
				firstVisibleHour * 60,
				Math.min(originalEndMinutes - 15, currentMinutes)
			);
			const newHours = Math.floor(newStartMinutes / 60);
			const newMins = newStartMinutes % 60;
			newStart = setHours(new Date(resizeOriginalStart), newHours);
			newStart = setMinutes(newStart, newMins);
		}

		// Update event via store (use updateDraftEvent for draft events)
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

		// Reset state
		isResizing = false;
		resizeEvent = null;
		resizeOriginalStart = null;
		resizeOriginalEnd = null;
		hasMoved = false;
	}

	// ========== Task Drag & Drop ==========

	function handleTaskDragStart(task: Task, e: PointerEvent) {
		e.preventDefault();
		isTaskDragging = true;
		draggedTask = task;
		hasMoved = false;

		// Initialize preview position
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - firstVisibleHour * 60;
			taskDragPreviewTop = (startMinutes / (totalVisibleHours * 60)) * 100;
		}

		const duration = task.estimatedDuration || 30;
		taskDragPreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleTaskDragMove);
		document.addEventListener('pointerup', handleTaskDragEnd);
	}

	function handleTaskDragMove(e: PointerEvent) {
		if (!isTaskDragging || !draggedTask) return;
		hasMoved = true;

		// Find which day column we're over
		const daysEl = daysContainerEl;
		if (!daysEl) return;

		const dayColumns = daysEl.querySelectorAll('.day-column');
		for (let i = 0; i < dayColumns.length; i++) {
			const col = dayColumns[i];
			const rect = col.getBoundingClientRect();
			if (e.clientX >= rect.left && e.clientX <= rect.right) {
				taskDragTargetDay = days[i];
				break;
			}
		}

		// Calculate vertical position
		const targetColumn = daysEl.querySelector('.day-column');
		if (!targetColumn) return;
		const rect = targetColumn.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		// Snap to 15-minute intervals
		const minutesPerPercent = (totalVisibleHours * 60) / 100;
		const rawMinutes = percentY * minutesPerPercent;
		const snappedMinutes = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
		taskDragPreviewTop = (snappedMinutes / (totalVisibleHours * 60)) * 100;
	}

	async function handleTaskDragEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleTaskDragMove);
		document.removeEventListener('pointerup', handleTaskDragEnd);

		if (!isTaskDragging || !draggedTask || !hasMoved) {
			isTaskDragging = false;
			draggedTask = null;
			taskDragTargetDay = null;
			return;
		}

		// Calculate new time from position
		const minutesFromStart = (taskDragPreviewTop / 100) * (totalVisibleHours * 60);
		const totalMinutes = firstVisibleHour * 60 + minutesFromStart;
		const hours = Math.floor(totalMinutes / 60);
		const minutes = Math.round(totalMinutes % 60);

		const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

		// Calculate end time based on duration
		const duration = draggedTask.estimatedDuration || 30;
		const endTotalMinutes = totalMinutes + duration;
		const endHours = Math.floor(endTotalMinutes / 60);
		const endMins = Math.round(endTotalMinutes % 60);
		const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

		await todosStore.updateTodo(draggedTask.id, {
			scheduledDate: taskDragTargetDay ? format(taskDragTargetDay, 'yyyy-MM-dd') : undefined,
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
		});

		isTaskDragging = false;
		draggedTask = null;
		taskDragTargetDay = null;
		hasMoved = false;
	}

	// ========== Task Resize ==========

	function handleTaskResizeStart(task: Task, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();
		isTaskResizing = true;
		resizeTask = task;
		taskResizeEdge = edge;
		hasMoved = false;

		// Initialize preview position
		if (task.scheduledStartTime) {
			const [h, m] = task.scheduledStartTime.split(':').map(Number);
			const startMinutes = h * 60 + m - firstVisibleHour * 60;
			taskResizePreviewTop = (startMinutes / (totalVisibleHours * 60)) * 100;
		}

		const duration = task.estimatedDuration || 30;
		taskResizePreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleTaskResizeMove);
		document.addEventListener('pointerup', handleTaskResizeEnd);
	}

	function handleTaskResizeMove(e: PointerEvent) {
		if (!isTaskResizing || !resizeTask) return;
		hasMoved = true;

		const daysEl = daysContainerEl;
		if (!daysEl) return;

		const targetColumn = daysEl.querySelector('.day-column');
		if (!targetColumn) return;

		const rect = targetColumn.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		const minutesPerPercent = (totalVisibleHours * 60) / 100;

		if (taskResizeEdge === 'top') {
			// Adjust start time, keep end fixed
			const originalEndPercent = taskResizePreviewTop + taskResizePreviewHeight;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
			taskResizePreviewTop = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, originalEndPercent - taskResizePreviewTop);
		} else {
			// Adjust end time, keep start fixed
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
			const newBottom = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, newBottom - taskResizePreviewTop);
		}
	}

	async function handleTaskResizeEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleTaskResizeMove);
		document.removeEventListener('pointerup', handleTaskResizeEnd);

		if (!isTaskResizing || !resizeTask || !hasMoved) {
			isTaskResizing = false;
			resizeTask = null;
			return;
		}

		// Calculate new times from position
		const startMinutes =
			(taskResizePreviewTop / 100) * (totalVisibleHours * 60) + firstVisibleHour * 60;
		const endMinutes =
			((taskResizePreviewTop + taskResizePreviewHeight) / 100) * (totalVisibleHours * 60) +
			firstVisibleHour * 60;

		const startHours = Math.floor(startMinutes / 60);
		const startMins = Math.round(startMinutes % 60);
		const endHours = Math.floor(endMinutes / 60);
		const endMins = Math.round(endMinutes % 60);

		const newStartTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
		const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
		const newDuration = Math.round(endMinutes - startMinutes);

		await todosStore.updateTodo(resizeTask.id, {
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
			estimatedDuration: newDuration,
		});

		isTaskResizing = false;
		resizeTask = null;
		hasMoved = false;
	}

	// ========== Sidebar Task Drop ==========
	let sidebarDropTarget = $state<{ day: Date; y: number } | null>(null);

	function handleSidebarDragOver(e: DragEvent, day: Date) {
		e.preventDefault();
		if (!e.dataTransfer) return;

		// Check if this is a sidebar task drag
		const types = e.dataTransfer.types;
		if (!types.includes('application/json')) return;

		e.dataTransfer.dropEffect = 'move';
		sidebarDropTarget = { day, y: e.clientY };
	}

	function handleSidebarDragLeave(e: DragEvent) {
		// Only clear if leaving the column entirely
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!relatedTarget?.closest('.day-column')) {
			sidebarDropTarget = null;
		}
	}

	async function handleSidebarDrop(e: DragEvent, day: Date) {
		e.preventDefault();
		sidebarDropTarget = null;

		if (!e.dataTransfer) return;

		const jsonData = e.dataTransfer.getData('application/json');
		if (!jsonData) return;

		try {
			const data = JSON.parse(jsonData);
			if (data.type !== 'sidebar-task') return;

			// Calculate drop time from Y position
			const dayColumn = (e.target as HTMLElement).closest('.day-column');
			if (!dayColumn) return;

			const rect = dayColumn.getBoundingClientRect();
			const relativeY = e.clientY - rect.top;
			const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

			const minutesPerPercent = (totalVisibleHours * 60) / 100;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
			const totalMinutes = firstVisibleHour * 60 + snappedMinutes;

			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

			// Calculate end time
			const duration = data.estimatedDuration || 30;
			const endMinutes = totalMinutes + duration;
			const endHours = Math.floor(endMinutes / 60);
			const endMins = endMinutes % 60;
			const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

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

	// ========== Keyboard Handling ==========

	function handleKeyDown(e: KeyboardEvent) {
		// Cancel drag/resize on Escape
		if (e.key === 'Escape') {
			if (isDragging || isResizing) {
				e.preventDefault();
				document.removeEventListener('pointermove', handleDragMove);
				document.removeEventListener('pointerup', handleDragEnd);
				document.removeEventListener('pointermove', handleResizeMove);
				document.removeEventListener('pointerup', handleResizeEnd);
				isDragging = false;
				draggedEvent = null;
				dragTargetDay = null;
				isResizing = false;
				resizeEvent = null;
				resizeOriginalStart = null;
				resizeOriginalEnd = null;
				hasMoved = false;
			}
			// Cancel task drag/resize
			if (isTaskDragging || isTaskResizing) {
				e.preventDefault();
				document.removeEventListener('pointermove', handleTaskDragMove);
				document.removeEventListener('pointerup', handleTaskDragEnd);
				document.removeEventListener('pointermove', handleTaskResizeMove);
				document.removeEventListener('pointerup', handleTaskResizeEnd);
				isTaskDragging = false;
				draggedTask = null;
				taskDragTargetDay = null;
				isTaskResizing = false;
				resizeTask = null;
				hasMoved = false;
			}
		}
	}

	// Add global keydown listener
	$effect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="week-view">
	<!-- Week number indicator (if enabled) -->
	{#if settingsStore.showWeekNumbers}
		<div class="week-number-indicator">
			{$_('views.weekNumber')}
			{weekNumber}
		</div>
	{/if}

	<!-- All-day events row (only shown when there are header-mode all-day events) -->
	{#if hasAnyHeaderAllDayEvents}
		<div class="all-day-row">
			<div class="time-gutter">
				{#if settingsStore.showWeekNumbers}
					<span class="week-label">{$_('views.weekNumber')} {weekNumber}</span>
				{/if}
			</div>
			{#each days as day}
				<div class="all-day-cell">
					{#each getHeaderAllDayEventsForDay(day) as event}
						<button
							class="all-day-event"
							class:search-highlighted={searchStore.isEventHighlighted(event.id)}
							class:search-dimmed={searchStore.isEventDimmed(event.id)}
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							onclick={() => goto(`/?event=${event.id}`)}
						>
							{event.title}
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Day headers -->
	<div class="day-headers">
		<div class="time-gutter"></div>
		{#each days as day}
			<div class="day-header" class:today={isToday(day)}>
				<span class="day-name">{format(day, 'EEE', { locale: currentDateLocale })}</span>
				<span class="day-number" class:today={isToday(day)}>{format(day, 'd')}</span>
			</div>
		{/each}
	</div>

	<!-- Time grid -->
	<div class="time-grid scrollbar-thin">
		<!-- Time column -->
		<div class="time-column">
			{#each hours as hour}
				<div class="time-label">
					{settingsStore.formatHour(hour)}
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		<div class="days-container" bind:this={daysContainerEl}>
			{#each days as day, dayIndex}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="day-column"
					class:today={isToday(day)}
					class:drop-target={sidebarDropTarget && isSameDay(day, sidebarDropTarget.day)}
					ondragover={(e) => handleSidebarDragOver(e, day)}
					ondragleave={handleSidebarDragLeave}
					ondrop={(e) => handleSidebarDrop(e, day)}
				>
					{#each hours as hour}
						<button
							class="hour-slot"
							onclick={(e) => handleSlotClick(day, hour, e)}
							aria-label={`${format(day, 'EEEE', { locale: currentDateLocale })} ${settingsStore.formatHour(hour)}`}
						></button>
					{/each}

					<!-- Block-style all-day events -->
					{#each getBlockAllDayEventsForDay(day) as event (event.id)}
						<button
							class="all-day-block-event"
							class:search-highlighted={searchStore.isEventHighlighted(event.id)}
							class:search-dimmed={searchStore.isEventDimmed(event.id)}
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							onclick={() => goto(`/?event=${event.id}`)}
						>
							<span class="event-title">{event.title}</span>
						</button>
					{/each}

					<!-- Timed events -->
					{#each getEventsForDay(day) as event (event.id)}
						{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
						{@const isBeingResized = isResizing && resizeEvent?.id === event.id}
						{@const isDraft = eventsStore.isDraftEvent(event.id)}
						{@const isCrossDayDrag =
							isBeingDragged && dragTargetDay && !isSameDay(day, dragTargetDay)}
						{@const isSearchHighlighted = searchStore.isEventHighlighted(event.id)}
						{@const isSearchDimmed = searchStore.isEventDimmed(event.id)}
						<div
							class="event-card"
							class:dragging={isBeingDragged && !isCrossDayDrag}
							class:dragging-source={isCrossDayDrag}
							class:resizing={isBeingResized}
							class:draft={isDraft}
							class:search-highlighted={isSearchHighlighted}
							class:search-dimmed={isSearchDimmed}
							data-event-id={event.id}
							style={isBeingDragged && !isCrossDayDrag
								? `top: ${dragPreviewTop}%; height: ${dragPreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};`
								: isBeingResized
									? `top: ${resizePreviewTop}%; height: ${resizePreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};`
									: getEventStyle(event)}
							role="button"
							tabindex="0"
							aria-label={event.title || $_('calendar.draftEvent')}
							onpointerdown={(e) => startDrag(event, e)}
							onclick={(e) => !isDraft && handleEventClick(event, e)}
							onkeydown={(e) => !isDraft && e.key === 'Enter' && goto(`/?event=${event.id}`)}
						>
							<!-- Top resize handle -->
							<div
								class="resize-handle top"
								onpointerdown={(e) => startResize(event, 'top', e)}
								role="slider"
								aria-label={$_('event.changeStartTime')}
								aria-valuenow={0}
								tabindex="-1"
							></div>

							<span class="event-time">
								{formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
							</span>
							<span class="event-title"
								>{event.title || (isDraft ? $_('calendar.draftEvent') : '')}</span
							>

							<!-- Bottom resize handle -->
							<div
								class="resize-handle bottom"
								onpointerdown={(e) => startResize(event, 'bottom', e)}
								role="slider"
								aria-label={$_('event.changeEndTime')}
								aria-valuenow={0}
								tabindex="-1"
							></div>
						</div>
					{/each}

					<!-- Scheduled Tasks (Time-Blocking) -->
					{#each getScheduledTasksForDay(day) as task (task.id)}
						{@const isTaskBeingDragged = isTaskDragging && draggedTask?.id === task.id}
						{@const isTaskBeingResized = isTaskResizing && resizeTask?.id === task.id}
						{@const isTaskCrossDayDrag =
							isTaskBeingDragged &&
							taskDragTargetDay !== null &&
							!isSameDay(day, taskDragTargetDay)}
						<TaskBlock
							{task}
							style={isTaskBeingDragged && !isTaskCrossDayDrag
								? `top: ${taskDragPreviewTop}%; height: ${taskDragPreviewHeight}%;`
								: isTaskBeingResized
									? `top: ${taskResizePreviewTop}%; height: ${taskResizePreviewHeight}%;`
									: getTaskStyle(task)}
							{onTaskClick}
							onDragStart={handleTaskDragStart}
							onResizeStart={handleTaskResizeStart}
							isDragging={isTaskBeingDragged && !isTaskCrossDayDrag}
							isResizing={isTaskBeingResized}
							isDraggingSource={isTaskCrossDayDrag}
						/>
					{/each}

					<!-- Task Drag preview (solid) for cross-day dragging - shows where task will be -->
					{#if isTaskDragging && draggedTask && taskDragTargetDay && isSameDay(day, taskDragTargetDay) && !getScheduledTasksForDay(day).some((t) => t.id === draggedTask!.id)}
						<TaskBlock
							task={draggedTask}
							style="top: {taskDragPreviewTop}%; height: {taskDragPreviewHeight}%;"
							isDragging={true}
						/>
					{/if}

					<!-- Drag preview (solid) for cross-day dragging - shows where event will be -->
					{#if isDragging && draggedEvent && dragTargetDay && isSameDay(day, dragTargetDay) && !getEventsForDay(day).some((e) => e.id === draggedEvent!.id)}
						<div
							class="event-card drag-preview"
							style="top: {dragPreviewTop}%; height: {dragPreviewHeight}%; background-color: {calendarsStore.getColor(
								draggedEvent.calendarId
							)};"
						>
							<span class="event-time">{formatEventTime(draggedEvent.startTime)}</span>
							<span class="event-title">{draggedEvent.title}</span>
						</div>
					{/if}

					<!-- Overflow indicators for events outside visible time range -->
					{#if true}
						{@const overflow = getOverflowEventsForDay(day)}
						{#if overflow.before.length > 0}
							<div class="overflow-indicator top" title="{overflow.before.length} Termin(e) früher">
								{#each overflow.before as event}
									<div
										class="overflow-line"
										style="background-color: {calendarsStore.getColor(event.calendarId)}"
										title="{formatEventTime(event.startTime)} {event.title}"
									></div>
								{/each}
							</div>
						{/if}
						{#if overflow.after.length > 0}
							<div
								class="overflow-indicator bottom"
								title="{overflow.after.length} Termin(e) später"
							>
								{#each overflow.after as event}
									<div
										class="overflow-line"
										style="background-color: {calendarsStore.getColor(event.calendarId)}"
										title="{formatEventTime(event.startTime)} {event.title}"
									></div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Current time indicator -->
					{#if isToday(day)}
						<div class="time-indicator" style="top: {currentTimePosition}%"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.week-view {
		display: flex;
		flex-direction: column;
	}

	.week-number-indicator {
		display: none; /* Hidden by default, shown in gutter instead */
	}

	.all-day-row {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
		min-height: 32px;
	}

	.all-day-cell {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 4px;
		border-left: 1px solid hsl(var(--color-border));
	}

	.all-day-event {
		padding: 2px 6px;
		font-size: 0.75rem;
		color: white;
		border-radius: var(--radius-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border: none;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.all-day-event.search-highlighted {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.3);
	}

	.all-day-event.search-dimmed {
		opacity: 0.35;
		filter: grayscale(0.3);
	}

	/* Block-style all-day events (displayed as full-day blocks in the grid) */
	.all-day-block-event {
		position: absolute;
		top: 0;
		left: 2px;
		right: 2px;
		bottom: 0;
		padding: 4px 6px;
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: pointer;
		z-index: 0;
		opacity: 0.3;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
	}

	.all-day-block-event:hover {
		opacity: 0.5;
	}

	.all-day-block-event.search-highlighted {
		opacity: 0.6;
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}

	.all-day-block-event.search-dimmed {
		opacity: 0.15;
		filter: grayscale(0.5);
	}

	.all-day-block-event .event-title {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.day-headers {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.time-gutter {
		width: var(--time-column-width);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.week-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		font-weight: 500;
	}

	.day-header {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		border-left: 1px solid hsl(var(--color-border));
	}

	.day-name {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.day-number {
		font-size: 1.25rem;
		font-weight: 600;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
	}

	.day-number.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.time-grid {
		flex: 1;
		display: flex;
	}

	.time-column {
		width: var(--time-column-width);
		flex-shrink: 0;
	}

	.time-label {
		height: var(--hour-height);
		padding-right: 0.5rem;
		text-align: right;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		position: relative;
		top: -0.5em;
	}

	.days-container {
		flex: 1;
		display: flex;
		position: relative;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border));
	}

	.day-column.today {
		background: hsl(var(--color-primary) / 0.05);
	}

	.day-column.drop-target {
		background: hsl(var(--color-primary) / 0.15);
		outline: 2px dashed hsl(var(--color-primary));
		outline-offset: -2px;
	}

	.hour-slot {
		height: var(--hour-height);
		width: 100%;
		border: none;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		background: transparent;
		cursor: pointer;
	}

	.hour-slot:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	.event-card {
		position: absolute;
		left: 2px;
		right: 2px;
		padding: 2px 4px;
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: grab;
		z-index: 1;
		overflow: hidden;
		transition:
			box-shadow 0.15s ease,
			opacity 0.15s ease;
		touch-action: none;
		user-select: none;
	}

	.event-card:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.event-card.dragging {
		cursor: grabbing;
		opacity: 0.9;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	.event-card.resizing {
		opacity: 0.85;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		outline: 2px dashed rgba(255, 255, 255, 0.6);
		outline-offset: -2px;
	}

	/* Ghost style for source position during cross-day drag */
	.event-card.dragging-source {
		opacity: 0.4;
		background: transparent !important;
		border: 2px dashed hsl(var(--color-border));
		pointer-events: none;
	}

	.event-card.dragging-source .event-title,
	.event-card.dragging-source .event-time {
		opacity: 0.5;
	}

	/* Solid preview at target position during cross-day drag */
	.event-card.drag-preview {
		pointer-events: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	/* Search highlighting */
	.event-card.search-highlighted {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		box-shadow:
			0 0 0 4px hsl(var(--color-primary) / 0.3),
			0 4px 12px rgba(0, 0, 0, 0.25);
		z-index: 10;
	}

	.event-card.search-dimmed {
		opacity: 0.35;
		filter: grayscale(0.3);
	}

	.event-card.draft {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: -1px;
		animation: pulse-outline 1.5s ease-in-out infinite;
	}

	@keyframes pulse-outline {
		0%,
		100% {
			outline-color: hsl(var(--color-primary));
		}
		50% {
			outline-color: hsl(var(--color-primary) / 0.5);
		}
	}

	.event-time {
		font-size: 0.65rem;
		opacity: 0.9;
		display: block;
	}

	.event-title {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
		opacity: 0;
		transition: opacity 0.15s ease;
		z-index: 2;
	}

	.resize-handle.top {
		top: 0;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	.resize-handle.bottom {
		bottom: 0;
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	.event-card:hover .resize-handle {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}

	.resize-handle:hover {
		background: rgba(255, 255, 255, 0.5) !important;
	}

	.time-indicator {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: hsl(var(--color-error));
		z-index: 2;
	}

	.time-indicator::before {
		content: '';
		position: absolute;
		left: -4px;
		top: -4px;
		width: 10px;
		height: 10px;
		background: hsl(var(--color-error));
		border-radius: 50%;
	}

	/* Overflow indicators for events outside visible time range */
	.overflow-indicator {
		position: absolute;
		left: 2px;
		right: 2px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		z-index: 5;
		padding: 2px;
	}

	.overflow-indicator.top {
		top: 0;
	}

	.overflow-indicator.bottom {
		bottom: 0;
	}

	.overflow-line {
		height: 3px;
		border-radius: 2px;
		opacity: 0.7;
		cursor: pointer;
		transition:
			opacity 0.15s ease,
			height 0.15s ease;
	}

	.overflow-line:hover {
		opacity: 1;
		height: 5px;
	}
</style>
