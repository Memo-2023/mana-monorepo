<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		isToday,
		parseISO,
		differenceInMinutes,
		addMinutes,
		setHours,
		setMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
	}

	let { onQuickCreate }: Props = $props();

	// Constants
	const HOUR_HEIGHT = 60; // pixels per hour
	const SNAP_MINUTES = 15; // snap to 15-minute intervals

	// Generate hours (filtered based on settings)
	let allHours = Array.from({ length: 24 }, (_, i) => i);
	let hours = $derived(
		settingsStore.filterHoursEnabled
			? allHours.filter((h) => h >= settingsStore.dayStartHour && h < settingsStore.dayEndHour)
			: allHours
	);

	// Calculate visible hours range for positioning
	let firstVisibleHour = $derived(settingsStore.filterHoursEnabled ? settingsStore.dayStartHour : 0);
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

	let timedEvents = $derived(
		eventsStore.getEventsForDay(viewStore.currentDate).filter((e) => !e.isAllDay)
	);

	let allDayEvents = $derived(
		eventsStore.getEventsForDay(viewStore.currentDate).filter((e) => e.isAllDay)
	);

	// Get display mode for an event (per-event override takes precedence over global setting)
	function getEventDisplayMode(event: any): 'header' | 'block' {
		return event.metadata?.allDayDisplayMode || settingsStore.allDayDisplayMode;
	}

	// Split all-day events by display mode
	let headerAllDayEvents = $derived(
		allDayEvents.filter(e => getEventDisplayMode(e) === 'header')
	);

	let blockAllDayEvents = $derived(
		allDayEvents.filter(e => getEventDisplayMode(e) === 'block')
	);

	// ============================================================================
	// Drag & Drop State
	// ============================================================================
	let isDragging = $state(false);
	let draggedEvent = $state<any>(null);
	let dragOffsetMinutes = $state(0);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);
	let dayColumnRef = $state<HTMLElement | null>(null);

	// ============================================================================
	// Resize State
	// ============================================================================
	let isResizing = $state(false);
	let resizeEvent = $state<any>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeOriginalStart = $state<Date | null>(null);
	let resizeOriginalEnd = $state<Date | null>(null);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);

	// Track if we actually moved during drag/resize (to prevent click on simple mousedown/up)
	let hasMoved = $state(false);

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
	function startDrag(event: any, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
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
		const clampedMinutes = Math.max(firstVisibleHour * 60, Math.min(newStartMinutes, lastVisibleHour * 60 - 15));

		dragPreviewTop = minutesToPercent(clampedMinutes);
	}

	function handleDragEnd(e: PointerEvent) {
		if (!isDragging || !draggedEvent || !hasMoved) {
			cleanup();
			return;
		}

		const mouseMinutes = getMinutesFromY(e.clientY);
		const newStartMinutes = snapToGrid(mouseMinutes - dragOffsetMinutes);
		const clampedMinutes = Math.max(firstVisibleHour * 60, Math.min(newStartMinutes, lastVisibleHour * 60 - 30));

		const start = typeof draggedEvent.startTime === 'string' ? parseISO(draggedEvent.startTime) : draggedEvent.startTime;
		const end = typeof draggedEvent.endTime === 'string' ? parseISO(draggedEvent.endTime) : draggedEvent.endTime;
		const duration = differenceInMinutes(end, start);

		// Create new start time on same day
		let newStart = new Date(viewStore.currentDate);
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
	function startResize(event: any, edge: 'top' | 'bottom', e: PointerEvent) {
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
		const mouseMinutes = getMinutesFromY(e.clientY);
		const snappedMinutes = snapToGrid(mouseMinutes);

		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		if (resizeEdge === 'top') {
			const newStartMinutes = Math.min(snappedMinutes, origEndMinutes - SNAP_MINUTES);
			const clampedStart = Math.max(firstVisibleHour * 60, newStartMinutes);
			resizePreviewTop = minutesToPercent(clampedStart);
			resizePreviewHeight = ((origEndMinutes - clampedStart) / (totalVisibleHours * 60)) * 100;
		} else {
			const newEndMinutes = Math.max(snappedMinutes, origStartMinutes + SNAP_MINUTES);
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
		const snappedMinutes = snapToGrid(mouseMinutes);

		const origStartMinutes = resizeOriginalStart.getHours() * 60 + resizeOriginalStart.getMinutes();
		const origEndMinutes = resizeOriginalEnd.getHours() * 60 + resizeOriginalEnd.getMinutes();

		let newStart = new Date(resizeOriginalStart);
		let newEnd = new Date(resizeOriginalEnd);

		if (resizeEdge === 'top') {
			const newStartMinutes = Math.max(firstVisibleHour * 60, Math.min(snappedMinutes, origEndMinutes - SNAP_MINUTES));
			newStart = setHours(new Date(viewStore.currentDate), Math.floor(newStartMinutes / 60));
			newStart = setMinutes(newStart, newStartMinutes % 60);
			newStart.setSeconds(0, 0);
		} else {
			const newEndMinutes = Math.min(lastVisibleHour * 60, Math.max(snappedMinutes, origStartMinutes + SNAP_MINUTES));
			newEnd = setHours(new Date(viewStore.currentDate), Math.floor(newEndMinutes / 60));
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
		hasMoved = false;
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);
		document.removeEventListener('pointermove', handleResizeMove);
		document.removeEventListener('pointerup', handleResizeEnd);
	}

	// ============================================================================
	// Keyboard Handling
	// ============================================================================
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && (isDragging || isResizing)) {
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
	function getEventStyle(event: any) {
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		// Use percentage-based positioning for consistency with other views
		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 1.5); // minimum ~20px at 60px/hour

		const color = calendarsStore.getColor(event.calendarId);

		return `top: ${top}%; height: ${height}%; background-color: ${color};`;
	}

	function handleEventClick(event: any, e: MouseEvent) {
		// Don't navigate if dragging or resizing, or if we moved
		if (isDragging || isResizing || hasMoved) {
			e.preventDefault();
			e.stopPropagation();
			setTimeout(() => { hasMoved = false; }, 100);
			return;
		}
		goto(`/?event=${event.id}`);
	}

	function handleSlotClick(hour: number, e: MouseEvent) {
		// Don't create event if dragging or resizing
		if (isDragging || isResizing) return;

		const startTime = new Date(viewStore.currentDate);
		startTime.setHours(hour, 0, 0, 0);

		if (onQuickCreate) {
			onQuickCreate(startTime, { x: e.clientX, y: e.clientY });
		} else {
			goto(`/event/new?start=${startTime.toISOString()}`);
		}
	}
</script>

<div class="day-view">
	<!-- Header-style all-day events -->
	{#if headerAllDayEvents.length > 0}
		<div class="all-day-section">
			<div class="time-gutter">
				<span class="all-day-label">Ganztägig</span>
			</div>
			<div class="all-day-events">
				{#each headerAllDayEvents as event}
					<button
						class="all-day-event"
						style="background-color: {calendarsStore.getColor(event.calendarId)}"
						onclick={(e) => handleEventClick(event, e)}
					>
						{event.title}
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

		<div
			class="day-column"
			class:today={isToday(viewStore.currentDate)}
			bind:this={dayColumnRef}
		>
			{#each hours as hour}
				<button
					class="hour-slot"
					onclick={(e) => handleSlotClick(hour, e)}
					aria-label={`${hour}:00 Uhr`}
				></button>
			{/each}

			<!-- Block-style all-day events -->
			{#each blockAllDayEvents as event}
				<button
					class="all-day-block-event"
					style="background-color: {calendarsStore.getColor(event.calendarId)}"
					onclick={(e) => handleEventClick(event, e)}
				>
					<span class="event-title">{event.title}</span>
				</button>
			{/each}

			<!-- Timed events -->
			{#each timedEvents as event}
				{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
				{@const isBeingResized = isResizing && resizeEvent?.id === event.id}
				{@const isDraft = eventsStore.isDraftEvent(event.id)}
				<div
					class="event-card"
					class:dragging={isBeingDragged}
					class:resizing={isBeingResized}
					class:draft={isDraft}
					data-event-id={event.id}
					style={isBeingDragged ? `top: ${dragPreviewTop}%; height: ${dragPreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};` : isBeingResized ? `top: ${resizePreviewTop}%; height: ${resizePreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};` : getEventStyle(event)}
					onpointerdown={(e) => startDrag(event, e)}
					onclick={(e) => !isDraft && handleEventClick(event, e)}
					role="button"
					tabindex="0"
				>
					<!-- Top resize handle -->
					<div
						class="resize-handle top"
						onpointerdown={(e) => startResize(event, 'top', e)}
						role="slider"
						aria-label="Startzeit ändern"
						tabindex="-1"
					></div>

					<span class="event-time">
						{format(
							typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime,
							'HH:mm'
						)} -
						{format(
							typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime,
							'HH:mm'
						)}
					</span>
					<span class="event-title">{event.title || (isDraft ? '(Neuer Termin)' : '')}</span>
					{#if event.location}
						<span class="event-location">{event.location}</span>
					{/if}

					<!-- Bottom resize handle -->
					<div
						class="resize-handle bottom"
						onpointerdown={(e) => startResize(event, 'bottom', e)}
						role="slider"
						aria-label="Endzeit ändern"
						tabindex="-1"
					></div>
				</div>
			{/each}

			<!-- Current time indicator -->
			{#if isToday(viewStore.currentDate)}
				<div class="time-indicator" style="top: {currentTimePosition}%"></div>
			{/if}
		</div>
	</div>
</div>

<style>
	.day-view {
		display: flex;
		flex-direction: column;
	}

	.all-day-section {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
		padding: 0.5rem 0;
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
	}

	/* Block-style all-day events (displayed as full-day blocks in the grid) */
	.all-day-block-event {
		position: absolute;
		top: 0;
		left: 4px;
		right: 4px;
		bottom: 0;
		padding: 8px 12px;
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

	.time-gutter {
		width: var(--time-column-width);
		flex-shrink: 0;
		padding-right: 0.5rem;
		text-align: right;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border));
	}

	.day-column.today {
		background: hsl(var(--color-primary) / 0.05);
	}

	.event-card {
		position: absolute;
		left: 4px;
		right: 4px;
		color: white;
		border: none;
		text-align: left;
		cursor: grab;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		touch-action: none;
		user-select: none;
		transition: box-shadow 150ms ease, opacity 150ms ease;
	}

	.event-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.event-card.dragging {
		cursor: grabbing;
		opacity: 0.9;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		z-index: 100;
	}

	.event-card.resizing {
		cursor: ns-resize;
		opacity: 0.85;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
		z-index: 100;
		outline: 2px dashed rgba(255, 255, 255, 0.6);
		outline-offset: -2px;
	}

	.event-card.draft {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: -1px;
		animation: pulse-outline 1.5s ease-in-out infinite;
	}

	@keyframes pulse-outline {
		0%, 100% {
			outline-color: hsl(var(--color-primary));
		}
		50% {
			outline-color: hsl(var(--color-primary) / 0.5);
		}
	}

	/* Resize Handles */
	.resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
		opacity: 0;
		transition: opacity 150ms ease;
		z-index: 10;
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

	.event-time {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.event-title {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.event-location {
		font-size: 0.75rem;
		opacity: 0.8;
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
</style>
