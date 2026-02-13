<script lang="ts">
	import { onMount } from 'svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { todosStore, type Task } from '$lib/stores/todos.svelte';
	import { eventContextMenuStore } from '$lib/stores/eventContextMenu.svelte';
	import { birthdaysStore } from '$lib/stores/birthdays.svelte';
	import BirthdayPopover from '$lib/components/birthday/BirthdayPopover.svelte';
	import { useVisibleHours, useCurrentTimeIndicator, useBirthdayPopover } from '$lib/composables';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { HOUR_HEIGHT_PX, SNAP_INTERVAL_MINUTES } from '$lib/utils/calendarConstants';
	import {
		getVisibleTimedEvents,
		getVisibleAllDayEvents,
		getVisibleOverflowEvents,
		type OverflowEvents,
	} from '$lib/utils/eventFiltering';
	import EventCard from './EventCard.svelte';
	import TaskBlock from './TaskBlock.svelte';
	import EventContextMenu from '$lib/components/event/EventContextMenu.svelte';
	import { goto } from '$app/navigation';
	import { format, isToday, differenceInMinutes, addMinutes, setHours, setMinutes } from 'date-fns';
	import { de } from 'date-fns/locale';

	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		/** Optional date override for carousel navigation (uses viewStore.currentDate if not provided) */
		date?: Date;
		onQuickCreate?: (date: Date, position: { x: number; y: number }, endDate?: Date) => void;
		onEventClick?: (event: CalendarEvent) => void;
		onTaskClick?: (task: Task) => void;
	}

	let { date, onQuickCreate, onEventClick, onTaskClick }: Props = $props();

	// Use provided date or fall back to viewStore
	let effectiveDate = $derived(date ?? viewStore.currentDate);

	// Use shared constants
	const HOUR_HEIGHT = HOUR_HEIGHT_PX;
	const SNAP_MINUTES = SNAP_INTERVAL_MINUTES;

	// Use composables for hour filtering and time indicator
	const visibleHours = useVisibleHours();
	const timeIndicator = useCurrentTimeIndicator();

	// Destructure for convenience (these are reactive getters)
	let hours = $derived(visibleHours.hours);
	let firstVisibleHour = $derived(visibleHours.firstVisibleHour);
	let lastVisibleHour = $derived(visibleHours.lastVisibleHour);
	let totalVisibleHours = $derived(visibleHours.totalVisibleHours);
	const minutesToPercent = visibleHours.minutesToPercent;

	// Current time indicator position
	let currentTimePosition = $derived(minutesToPercent(timeIndicator.currentMinutes));

	// Get timed events, filtering out those outside visible range when hour filter is enabled
	let timedEvents = $derived(
		getVisibleTimedEvents(
			eventsStore.getEventsForDay(effectiveDate),
			calendarsStore.visibleCalendars,
			{
				filterHoursEnabled: settingsStore.filterHoursEnabled,
				dayStartHour: settingsStore.dayStartHour,
				dayEndHour: settingsStore.dayEndHour,
			}
		)
	);

	// Get events that are completely outside the visible time range
	let overflowEvents = $derived.by((): OverflowEvents => {
		if (!settingsStore.filterHoursEnabled) {
			return { before: [], after: [] };
		}
		return getVisibleOverflowEvents(
			eventsStore.getEventsForDay(effectiveDate),
			calendarsStore.visibleCalendars,
			settingsStore.dayStartHour,
			settingsStore.dayEndHour
		);
	});

	let allDayEvents = $derived(
		getVisibleAllDayEvents(
			eventsStore.getEventsForDay(effectiveDate),
			calendarsStore.visibleCalendars
		)
	);

	// Get display mode for an event (per-event override takes precedence over global setting)
	function getEventDisplayMode(event: CalendarEvent): 'header' | 'block' {
		return (
			(event.metadata as { allDayDisplayMode?: 'header' | 'block' } | null)?.allDayDisplayMode ||
			settingsStore.allDayDisplayMode
		);
	}

	// Split all-day events by display mode
	let headerAllDayEvents = $derived(
		allDayEvents.filter((e) => getEventDisplayMode(e) === 'header')
	);

	let blockAllDayEvents = $derived(allDayEvents.filter((e) => getEventDisplayMode(e) === 'block'));

	// Birthday Popover (using composable)
	const birthdayPopover = useBirthdayPopover();

	// Get birthdays for current day (if enabled in settings)
	let birthdays = $derived.by(() => {
		if (!settingsStore.showBirthdays) return [];
		return birthdaysStore.getBirthdaysForDay(effectiveDate);
	});

	// ============================================================================
	// Drag & Drop State
	// ============================================================================
	let isDragging = $state(false);
	let draggedEvent = $state<CalendarEvent | null>(null);
	let dragOffsetMinutes = $state(0);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);
	let dayColumnRef = $state<HTMLElement | null>(null);

	// Scroll to current hour on mount
	onMount(() => {
		const scrollContainer = dayColumnRef?.parentElement;
		if (!scrollContainer) return;

		// Use CSS variable for hour height (default 48px)
		const hourHeight =
			parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-height')) ||
			48;
		const currentHour = new Date().getHours();
		const viewportHeight = scrollContainer.clientHeight;

		// Calculate scroll position to center current hour in viewport
		// Account for firstVisibleHour (if hour filtering is enabled)
		const effectiveHour = Math.max(0, currentHour - firstVisibleHour);
		const scrollPosition = effectiveHour * hourHeight - viewportHeight / 2 + hourHeight / 2;

		// Scroll to position (instant, not smooth, for initial load)
		scrollContainer.scrollTo({
			top: Math.max(0, scrollPosition),
			behavior: 'instant',
		});
	});

	// ============================================================================
	// Resize State
	// ============================================================================
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

	// ============================================================================
	// Drag-to-Create State
	// ============================================================================
	let isCreating = $state(false);
	let createStartMinutes = $state(0);
	let createEndMinutes = $state(0);
	let createPreviewTop = $state(0);
	let createPreviewHeight = $state(0);

	// ============================================================================
	// Task Drag & Drop State
	// ============================================================================
	let isTaskDragging = $state(false);
	let draggedTask = $state<Task | null>(null);
	let taskDragPreviewTop = $state(0);
	let taskDragPreviewHeight = $state(0);

	// Task Resize State
	let isTaskResizing = $state(false);
	let resizeTask = $state<Task | null>(null);
	let taskResizeEdge = $state<'top' | 'bottom'>('bottom');
	let taskResizePreviewTop = $state(0);
	let taskResizePreviewHeight = $state(0);

	// ============================================================================
	// Helper Functions
	// ============================================================================
	function getMinutesFromY(y: number): number {
		if (!dayColumnRef) return 0;
		const rect = dayColumnRef.getBoundingClientRect();
		const scrollTop = dayColumnRef.parentElement?.scrollTop || 0;
		const relativeY = y - rect.top + scrollTop;
		// Account for hidden early hours
		const visibleMinutes = (relativeY / (totalVisibleHours * HOUR_HEIGHT)) * totalVisibleHours * 60;
		const totalMinutes = visibleMinutes + firstVisibleHour * 60;
		// Snap to 15-minute intervals
		return Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
	}

	function snapToGrid(minutes: number): number {
		return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
	}

	// ============================================================================
	// Drag Handlers
	// ============================================================================
	function startDrag(event: CalendarEvent, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const start = toDate(event.startTime);
		const end = toDate(event.endTime);
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const clickMinutes = getMinutesFromY(e.clientY);
		dragOffsetMinutes = clickMinutes - startMinutes;

		isDragging = true;
		draggedEvent = event;
		hasMoved = false;
		dragPreviewTop = minutesToPercent(startMinutes);
		dragPreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;

		hasMoved = true;
		const mouseMinutes = getMinutesFromY(e.clientY);
		const newStartMinutes = snapToGrid(mouseMinutes - dragOffsetMinutes);
		const clampedMinutes = Math.max(
			firstVisibleHour * 60,
			Math.min(newStartMinutes, lastVisibleHour * 60 - 15)
		);

		dragPreviewTop = minutesToPercent(clampedMinutes);
	}

	function handleDragEnd(e: PointerEvent) {
		if (!isDragging || !draggedEvent || !hasMoved) {
			cleanup();
			return;
		}

		const mouseMinutes = getMinutesFromY(e.clientY);
		const newStartMinutes = snapToGrid(mouseMinutes - dragOffsetMinutes);
		const clampedMinutes = Math.max(
			firstVisibleHour * 60,
			Math.min(newStartMinutes, lastVisibleHour * 60 - 30)
		);

		const start = toDate(draggedEvent.startTime);
		const end = toDate(draggedEvent.endTime);
		const duration = differenceInMinutes(end, start);

		// Create new start time on same day
		let newStart = new Date(effectiveDate);
		newStart = setHours(newStart, Math.floor(clampedMinutes / 60));
		newStart = setMinutes(newStart, clampedMinutes % 60);
		newStart.setSeconds(0, 0);

		const newEnd = addMinutes(newStart, duration);

		// Update event (use updateDraftEvent for draft events)
		if (eventsStore.isDraftEvent(draggedEvent.id)) {
			eventsStore.updateDraftEvent({
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		} else {
			eventsStore.updateEvent(draggedEvent.id, {
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		}

		cleanup();
	}

	// ============================================================================
	// Resize Handlers
	// ============================================================================
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

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const endMinutes = end.getHours() * 60 + end.getMinutes();
		const duration = differenceInMinutes(end, start);
		resizePreviewTop = minutesToPercent(startMinutes);
		resizePreviewHeight = (duration / (totalVisibleHours * 60)) * 100;

		// Calculate offset between snapped click position and actual event boundary
		const clickMinutes = getMinutesFromY(e.clientY);
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

		hasMoved = true;
		const mouseMinutes = getMinutesFromY(e.clientY);
		// Apply offset to prevent jumping when drag starts
		const adjustedMinutes = snapToGrid(mouseMinutes - resizeOffsetMinutes);

		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		if (resizeEdge === 'top') {
			const newStartMinutes = Math.min(adjustedMinutes, origEndMinutes - SNAP_MINUTES);
			const clampedStart = Math.max(firstVisibleHour * 60, newStartMinutes);
			resizePreviewTop = minutesToPercent(clampedStart);
			resizePreviewHeight = ((origEndMinutes - clampedStart) / (totalVisibleHours * 60)) * 100;
		} else {
			const newEndMinutes = Math.max(adjustedMinutes, origStartMinutes + SNAP_MINUTES);
			const clampedEnd = Math.min(lastVisibleHour * 60, newEndMinutes);
			resizePreviewHeight = ((clampedEnd - origStartMinutes) / (totalVisibleHours * 60)) * 100;
		}
	}

	function handleResizeEnd(e: PointerEvent) {
		if (!isResizing || !resizeEvent || !resizeOriginalStart || !resizeOriginalEnd || !hasMoved) {
			cleanup();
			return;
		}

		const mouseMinutes = getMinutesFromY(e.clientY);
		// Apply offset to prevent jumping
		const adjustedMinutes = snapToGrid(mouseMinutes - resizeOffsetMinutes);

		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		let newStart = new Date(resizeOriginalStart);
		let newEnd = new Date(resizeOriginalEnd);

		if (resizeEdge === 'top') {
			const newStartMinutes = Math.max(
				firstVisibleHour * 60,
				Math.min(adjustedMinutes, origEndMinutes - SNAP_MINUTES)
			);
			newStart = setHours(new Date(effectiveDate), Math.floor(newStartMinutes / 60));
			newStart = setMinutes(newStart, newStartMinutes % 60);
			newStart.setSeconds(0, 0);
		} else {
			const newEndMinutes = Math.min(
				lastVisibleHour * 60,
				Math.max(adjustedMinutes, origStartMinutes + SNAP_MINUTES)
			);
			newEnd = setHours(new Date(effectiveDate), Math.floor(newEndMinutes / 60));
			newEnd = setMinutes(newEnd, newEndMinutes % 60);
			newEnd.setSeconds(0, 0);
		}

		// Update event (use updateDraftEvent for draft events)
		if (eventsStore.isDraftEvent(resizeEvent.id)) {
			eventsStore.updateDraftEvent({
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		} else {
			eventsStore.updateEvent(resizeEvent.id, {
				startTime: newStart.toISOString(),
				endTime: newEnd.toISOString(),
			});
		}

		cleanup();
	}

	function cleanup() {
		isDragging = false;
		draggedEvent = null;
		isResizing = false;
		resizeEvent = null;
		resizeOriginalStart = null;
		resizeOriginalEnd = null;
		resizeOffsetMinutes = 0;
		hasMoved = false;
		// Creating cleanup
		isCreating = false;
		createStartMinutes = 0;
		createEndMinutes = 0;
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);
		document.removeEventListener('pointermove', handleCreateMove);
		document.removeEventListener('pointerup', handleCreateEnd);
		// Task cleanup
		isTaskDragging = false;
		draggedTask = null;
		isTaskResizing = false;
		resizeTask = null;
		document.removeEventListener('pointermove', handleTaskDragMove);
		document.removeEventListener('pointerup', handleTaskDragEnd);
		document.removeEventListener('pointermove', handleTaskResizeMove);
		document.removeEventListener('pointerup', handleTaskResizeEnd);
	}

	// ============================================================================
	// Task Drag & Drop
	// ============================================================================
	function handleTaskDragStart(task: Task, e: PointerEvent) {
		e.preventDefault();
		isTaskDragging = true;
		draggedTask = task;
		hasMoved = false;

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
		if (!isTaskDragging || !draggedTask || !dayColumnRef) return;
		hasMoved = true;

		const rect = dayColumnRef.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		const minutesPerPercent = (totalVisibleHours * 60) / 100;
		const rawMinutes = percentY * minutesPerPercent;
		const snappedMinutes = Math.round(rawMinutes / 15) * 15;
		taskDragPreviewTop = (snappedMinutes / (totalVisibleHours * 60)) * 100;
	}

	async function handleTaskDragEnd() {
		document.removeEventListener('pointermove', handleTaskDragMove);
		document.removeEventListener('pointerup', handleTaskDragEnd);

		if (!isTaskDragging || !draggedTask || !hasMoved) {
			isTaskDragging = false;
			draggedTask = null;
			return;
		}

		const minutesFromStart = (taskDragPreviewTop / 100) * (totalVisibleHours * 60);
		const totalMinutes = firstVisibleHour * 60 + minutesFromStart;
		const hours = Math.floor(totalMinutes / 60);
		const minutes = Math.round(totalMinutes % 60);

		const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		const duration = draggedTask.estimatedDuration || 30;
		const endTotalMinutes = totalMinutes + duration;
		const endHours = Math.floor(endTotalMinutes / 60);
		const endMins = Math.round(endTotalMinutes % 60);
		const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

		await todosStore.updateTodo(draggedTask.id, {
			scheduledStartTime: newStartTime,
			scheduledEndTime: newEndTime,
		});

		isTaskDragging = false;
		draggedTask = null;
		hasMoved = false;
	}

	// ============================================================================
	// Task Resize
	// ============================================================================
	function handleTaskResizeStart(task: Task, edge: 'top' | 'bottom', e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();
		isTaskResizing = true;
		resizeTask = task;
		taskResizeEdge = edge;
		hasMoved = false;

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
		if (!isTaskResizing || !resizeTask || !dayColumnRef) return;
		hasMoved = true;

		const rect = dayColumnRef.getBoundingClientRect();
		const relativeY = e.clientY - rect.top;
		const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

		const minutesPerPercent = (totalVisibleHours * 60) / 100;

		if (taskResizeEdge === 'top') {
			const originalEndPercent = taskResizePreviewTop + taskResizePreviewHeight;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / 15) * 15;
			taskResizePreviewTop = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, originalEndPercent - taskResizePreviewTop);
		} else {
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / 15) * 15;
			const newBottom = (snappedMinutes / (totalVisibleHours * 60)) * 100;
			taskResizePreviewHeight = Math.max(2, newBottom - taskResizePreviewTop);
		}
	}

	async function handleTaskResizeEnd() {
		document.removeEventListener('pointermove', handleTaskResizeMove);
		document.removeEventListener('pointerup', handleTaskResizeEnd);

		if (!isTaskResizing || !resizeTask || !hasMoved) {
			isTaskResizing = false;
			resizeTask = null;
			return;
		}

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

	// ============================================================================
	// Sidebar Task Drop
	// ============================================================================
	let isSidebarDropTarget = $state(false);

	function handleSidebarDragOver(e: DragEvent) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		const types = e.dataTransfer.types;
		if (!types.includes('application/json')) return;
		e.dataTransfer.dropEffect = 'move';
		isSidebarDropTarget = true;
	}

	function handleSidebarDragLeave(e: DragEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!relatedTarget?.closest('.day-column')) {
			isSidebarDropTarget = false;
		}
	}

	async function handleSidebarDrop(e: DragEvent) {
		e.preventDefault();
		isSidebarDropTarget = false;

		if (!e.dataTransfer || !dayColumnRef) return;

		const jsonData = e.dataTransfer.getData('application/json');
		if (!jsonData) return;

		try {
			const data = JSON.parse(jsonData);
			if (data.type !== 'sidebar-task') return;

			const rect = dayColumnRef.getBoundingClientRect();
			const relativeY = e.clientY - rect.top;
			const percentY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

			const minutesPerPercent = (totalVisibleHours * 60) / 100;
			const rawMinutes = percentY * minutesPerPercent;
			const snappedMinutes = Math.round(rawMinutes / 15) * 15;
			const totalMinutes = firstVisibleHour * 60 + snappedMinutes;

			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

			const duration = data.estimatedDuration || 30;
			const endMinutes = totalMinutes + duration;
			const endHours = Math.floor(endMinutes / 60);
			const endMins = endMinutes % 60;
			const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

			await todosStore.updateTodo(data.taskId, {
				scheduledDate: format(effectiveDate, 'yyyy-MM-dd'),
				scheduledStartTime: startTime,
				scheduledEndTime: endTime,
				estimatedDuration: duration,
			});
		} catch (err) {
			console.error('Failed to parse drop data:', err);
		}
	}

	// ============================================================================
	// Keyboard Handling
	// ============================================================================
	function handleKeyDown(e: KeyboardEvent) {
		if (
			e.key === 'Escape' &&
			(isDragging || isResizing || isTaskDragging || isTaskResizing || isCreating)
		) {
			e.preventDefault();
			cleanup();
		}
	}

	// Add global keydown listener
	$effect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});

	// ============================================================================
	// Event Styling
	// ============================================================================
	function getEventStyle(event: CalendarEvent) {
		const start = toDate(event.startTime);
		const end = toDate(event.endTime);

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		// Use percentage-based positioning for consistency with other views
		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 1.5); // minimum ~20px at 60px/hour

		return `top: ${top}%; height: ${height}%;`;
	}

	function formatEventTime(event: CalendarEvent): string {
		return `${format(toDate(event.startTime), 'HH:mm')} - ${format(toDate(event.endTime), 'HH:mm')}`;
	}

	/**
	 * Calculate live time display during resize
	 */
	function getResizePreviewTime(): string {
		if (!resizeEvent || !resizeOriginalStart || !resizeOriginalEnd) return '';

		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		// Calculate from preview position
		const previewStartMinutes =
			(resizePreviewTop / 100) * totalVisibleHours * 60 + firstVisibleHour * 60;
		const previewEndMinutes =
			previewStartMinutes + (resizePreviewHeight / 100) * totalVisibleHours * 60;

		let startMinutes: number;
		let endMinutes: number;

		if (resizeEdge === 'top') {
			startMinutes = Math.round(previewStartMinutes);
			endMinutes = origEndMinutes;
		} else {
			startMinutes = origStartMinutes;
			endMinutes = Math.round(previewEndMinutes);
		}

		const startHours = Math.floor(startMinutes / 60);
		const startMins = startMinutes % 60;
		const endHours = Math.floor(endMinutes / 60);
		const endMins = endMinutes % 60;

		return `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
	}

	/**
	 * Get style for a scheduled task (time-blocking)
	 */
	function getTaskStyle(task: Task): string {
		if (!task.scheduledStartTime) return '';

		const [startHour, startMin] = task.scheduledStartTime.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;

		let duration = task.estimatedDuration || 30;
		if (task.scheduledEndTime) {
			const [endHour, endMin] = task.scheduledEndTime.split(':').map(Number);
			const endMinutes = endHour * 60 + endMin;
			duration = endMinutes - startMinutes;
		}

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 1.5);

		return `top: ${top}%; height: ${height}%;`;
	}

	/**
	 * Get scheduled tasks for current day
	 */
	function getScheduledTasks(): Task[] {
		return todosStore.getScheduledTasksForDay(effectiveDate);
	}

	function handleEventClick(event: CalendarEvent, e: MouseEvent) {
		// Don't navigate if dragging or resizing, or if we moved
		if (isDragging || isResizing || hasMoved) {
			e.preventDefault();
			e.stopPropagation();
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

	// ============================================================================
	// Drag-to-Create Handlers
	// ============================================================================
	function startCreate(e: PointerEvent) {
		// Don't create event if dragging or resizing
		if (isDragging || isResizing || isTaskDragging || isTaskResizing) return;

		// Don't start creating if clicking on an event, task, or other interactive element
		const target = e.target as HTMLElement;
		if (
			target.closest(
				'.event-card, .task-block, .all-day-event, .all-day-block-event, .overflow-indicator, .resize-handle'
			)
		) {
			return;
		}

		e.preventDefault();

		const minutes = getMinutesFromY(e.clientY);
		const snappedMinutes = snapToGrid(minutes);

		isCreating = true;
		hasMoved = false;
		createStartMinutes = snappedMinutes;
		createEndMinutes = snappedMinutes + SNAP_MINUTES; // Start with 15 min duration

		updateCreatePreview();

		document.addEventListener('pointermove', handleCreateMove);
		document.addEventListener('pointerup', handleCreateEnd);
	}

	function handleCreateMove(e: PointerEvent) {
		if (!isCreating) return;

		hasMoved = true;
		const minutes = getMinutesFromY(e.clientY);
		const snappedMinutes = snapToGrid(minutes);

		// Allow dragging both up and down from start point
		if (snappedMinutes >= createStartMinutes) {
			createEndMinutes = Math.max(snappedMinutes, createStartMinutes + SNAP_MINUTES);
		} else {
			// Dragging upward - swap start and end
			createEndMinutes = createStartMinutes + SNAP_MINUTES;
			createStartMinutes = snappedMinutes;
		}

		// Clamp to visible hours
		createStartMinutes = Math.max(firstVisibleHour * 60, createStartMinutes);
		createEndMinutes = Math.min(lastVisibleHour * 60, createEndMinutes);

		updateCreatePreview();
	}

	function updateCreatePreview() {
		createPreviewTop = minutesToPercent(createStartMinutes);
		const duration = createEndMinutes - createStartMinutes;
		createPreviewHeight = (duration / (totalVisibleHours * 60)) * 100;
	}

	function handleCreateEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleCreateMove);
		document.removeEventListener('pointerup', handleCreateEnd);

		if (!isCreating) return;

		// Calculate final times
		const startTime = new Date(effectiveDate);
		startTime.setHours(Math.floor(createStartMinutes / 60), createStartMinutes % 60, 0, 0);

		const endTime = new Date(effectiveDate);
		endTime.setHours(Math.floor(createEndMinutes / 60), createEndMinutes % 60, 0, 0);

		// Reset state
		isCreating = false;

		// Open quick create with the calculated times
		if (onQuickCreate) {
			onQuickCreate(startTime, { x: e.clientX, y: e.clientY }, endTime);
		} else {
			goto(`/event/new?start=${startTime.toISOString()}&end=${endTime.toISOString()}`);
		}

		hasMoved = false;
	}

	function getCreatePreviewTime(): string {
		const startHours = Math.floor(createStartMinutes / 60);
		const startMins = createStartMinutes % 60;
		const endHours = Math.floor(createEndMinutes / 60);
		const endMins = createEndMinutes % 60;
		return `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
	}

	function handleEventContextMenu(event: CalendarEvent, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		// Don't show context menu for draft events
		if (eventsStore.isDraftEvent(event.id)) return;
		eventContextMenuStore.show(event, e.clientX, e.clientY);
	}

	function handleContextMenuEdit(event: CalendarEvent) {
		if (onEventClick) {
			onEventClick(event);
		}
	}
</script>

<div class="day-view">
	<!-- Header-style all-day events and birthdays -->
	{#if headerAllDayEvents.length > 0 || birthdays.length > 0}
		<div class="all-day-section">
			<div class="time-gutter">
				<span class="all-day-label">Ganztägig</span>
			</div>
			<div class="all-day-events">
				{#each headerAllDayEvents as event}
					<button
						class="all-day-event"
						class:search-highlighted={searchStore.isEventHighlighted(event.id)}
						class:search-dimmed={searchStore.isEventDimmed(event.id)}
						style="background-color: {calendarsStore.getColor(event.calendarId)}"
						onclick={(e) => handleEventClick(event, e)}
					>
						{event.title}
					</button>
				{/each}
				<!-- Birthdays -->
				{#each birthdays as birthday}
					<button
						class="all-day-event birthday-event"
						onclick={(e) => birthdayPopover.handleBirthdayClick(birthday, e)}
					>
						🎂 {birthday.displayName}
						{#if settingsStore.showBirthdayAge && birthday.age > 0}
							<span class="birthday-age">({birthday.age})</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Time grid -->
	<div class="time-grid scrollbar-thin">
		<div class="time-column">
			{#each hours as hour}
				<div class="time-label">
					{hour.toString().padStart(2, '0')}:00
				</div>
			{/each}
		</div>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="day-column"
			class:today={isToday(effectiveDate)}
			class:drop-target={isSidebarDropTarget}
			class:creating={isCreating}
			bind:this={dayColumnRef}
			onpointerdown={startCreate}
			ondragover={handleSidebarDragOver}
			ondragleave={handleSidebarDragLeave}
			ondrop={handleSidebarDrop}
		>
			{#each hours as hour}
				<div class="hour-slot" role="button" tabindex="-1" aria-label={`${hour}:00 Uhr`}></div>
			{/each}

			<!-- Block-style all-day events -->
			{#each blockAllDayEvents as event}
				<button
					class="all-day-block-event"
					class:search-highlighted={searchStore.isEventHighlighted(event.id)}
					class:search-dimmed={searchStore.isEventDimmed(event.id)}
					style="background-color: {calendarsStore.getColor(event.calendarId)}"
					onclick={(e) => handleEventClick(event, e)}
				>
					<span class="event-title">{event.title}</span>
				</button>
			{/each}

			<!-- Timed events -->
			{#each timedEvents as event (event.id)}
				{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
				{@const isBeingResized = isResizing && resizeEvent?.id === event.id}
				<EventCard
					{event}
					style={isBeingDragged
						? `top: ${dragPreviewTop}%; height: ${dragPreviewHeight}%;`
						: isBeingResized
							? `top: ${resizePreviewTop}%; height: ${resizePreviewHeight}%;`
							: getEventStyle(event)}
					color={calendarsStore.getColor(event.calendarId)}
					isDragging={isBeingDragged}
					isResizing={isBeingResized}
					isSearchHighlighted={searchStore.isEventHighlighted(event.id)}
					isSearchDimmed={searchStore.isEventDimmed(event.id)}
					formattedTime={isBeingResized ? getResizePreviewTime() : formatEventTime(event)}
					onClick={handleEventClick}
					onPointerDown={startDrag}
					onContextMenu={handleEventContextMenu}
					onResizeStart={startResize}
				/>
			{/each}

			<!-- Scheduled Tasks (Time-Blocking) - only shown if enabled in settings -->
			{#if settingsStore.showTasksInCalendar}
				{#each getScheduledTasks() as task (task.id)}
					{@const isTaskBeingDragged = isTaskDragging && draggedTask?.id === task.id}
					{@const isTaskBeingResized = isTaskResizing && resizeTask?.id === task.id}
					<TaskBlock
						{task}
						style={isTaskBeingDragged
							? `top: ${taskDragPreviewTop}%; height: ${taskDragPreviewHeight}%;`
							: isTaskBeingResized
								? `top: ${taskResizePreviewTop}%; height: ${taskResizePreviewHeight}%;`
								: getTaskStyle(task)}
						{onTaskClick}
						onDragStart={handleTaskDragStart}
						onResizeStart={handleTaskResizeStart}
						isDragging={isTaskBeingDragged}
						isResizing={isTaskBeingResized}
					/>
				{/each}
			{/if}

			<!-- Create preview (drag-to-create) -->
			{#if isCreating}
				<div
					class="create-preview"
					style="top: {createPreviewTop}%; height: {createPreviewHeight}%; background-color: {calendarsStore.getColor(
						calendarsStore.defaultCalendar?.id || ''
					)};"
				>
					<span class="event-time">{getCreatePreviewTime()}</span>
					<span class="event-title">(Neuer Termin)</span>
				</div>
			{/if}

			<!-- Overflow indicators for events outside visible time range -->
			{#if overflowEvents.before.length > 0}
				<div class="overflow-indicator top" title="{overflowEvents.before.length} Termin(e) früher">
					{#each overflowEvents.before as event}
						<div
							class="overflow-line"
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							title="{format(toDate(event.startTime), 'HH:mm')} {event.title}"
						></div>
					{/each}
				</div>
			{/if}
			{#if overflowEvents.after.length > 0}
				<div
					class="overflow-indicator bottom"
					title="{overflowEvents.after.length} Termin(e) später"
				>
					{#each overflowEvents.after as event}
						<div
							class="overflow-line"
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							title="{format(toDate(event.startTime), 'HH:mm')} {event.title}"
						></div>
					{/each}
				</div>
			{/if}

			<!-- Current time indicator -->
			{#if isToday(effectiveDate)}
				<div class="time-indicator" style="top: {currentTimePosition}%"></div>
			{/if}
		</div>
	</div>
</div>

<!-- Event Context Menu -->
<EventContextMenu onEdit={handleContextMenuEdit} />

<!-- Birthday Popover -->
{#if birthdayPopover.selectedBirthday}
	<BirthdayPopover
		birthday={birthdayPopover.selectedBirthday}
		position={birthdayPopover.popoverPosition}
		onClose={birthdayPopover.closePopover}
	/>
{/if}

<style>
	.day-view {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.all-day-section {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
		padding: 0.5rem 0;
		width: 100%;
		max-width: 800px;
	}

	.all-day-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.all-day-events {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 0 0.5rem;
	}

	.all-day-event {
		padding: 4px 8px;
		font-size: 0.875rem;
		color: white;
		border-radius: var(--radius-sm);
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
		left: 8px;
		width: calc(100% - 16px);
		max-width: 400px;
		bottom: 0;
		padding: 8px 12px;
		color: white;
		border: none;
		border-radius: var(--radius-md);
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
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time-grid {
		flex: 1;
		display: flex;
		width: 100%;
		max-width: 800px;
	}

	.time-column {
		width: 50px;
		flex-shrink: 0;
		padding-top: 1rem;
		padding-bottom: 200px; /* Space for bottom UI (PillNav, InputBar, etc.) */
	}

	.time-label {
		height: var(--hour-height);
		padding-right: 0.75rem;
		text-align: right;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		position: relative;
		top: 0.25em;
	}

	.time-gutter {
		width: 50px;
		flex-shrink: 0;
		padding-right: 0.75rem;
		text-align: right;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border));
		max-width: 600px;
		padding-top: 1rem;
		padding-bottom: 200px; /* Space for bottom UI (PillNav, InputBar, etc.) */
	}

	.day-column.today {
		background: hsl(var(--color-primary) / 0.05);
	}

	.day-column.drop-target {
		background: hsl(var(--color-primary) / 0.15);
		outline: 2px dashed hsl(var(--color-primary));
		outline-offset: -2px;
	}

	/* Time indicator */
	.time-indicator {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: hsl(var(--color-error));
		z-index: 50;
	}

	.time-indicator::before {
		content: '';
		position: absolute;
		left: -4px;
		top: -4px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: hsl(var(--color-error));
	}

	/* Hour slots */
	.hour-slot {
		height: var(--hour-height);
		width: 100%;
		border: none;
		background: transparent;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		cursor: pointer;
	}

	.hour-slot:hover {
		background: hsl(var(--color-muted) / 0.2);
	}

	/* Create preview (drag-to-create) */
	.create-preview {
		position: absolute;
		left: 2px;
		right: 2px;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
		text-align: left;
		z-index: 50;
		overflow: hidden;
		color: white;
		opacity: 0.85;
		border: 2px dashed rgba(255, 255, 255, 0.5);
		pointer-events: none;
	}

	.create-preview .event-time {
		display: block;
		font-size: 0.6rem;
		opacity: 0.9;
	}

	.create-preview .event-title {
		display: block;
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.day-column.creating {
		cursor: ns-resize;
	}

	/* Overflow indicators for events outside visible time range */
	.overflow-indicator {
		position: absolute;
		left: 4px;
		right: 4px;
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

	/* Birthday events in all-day row */
	.all-day-event.birthday-event {
		background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
	}

	.all-day-event.birthday-event:hover {
		opacity: 0.9;
	}

	.birthday-age {
		opacity: 0.85;
		font-size: 0.7rem;
	}
</style>
