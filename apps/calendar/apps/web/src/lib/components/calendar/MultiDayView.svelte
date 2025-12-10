<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		eachDayOfInterval,
		isToday,
		isSameDay,
		parseISO,
		differenceInMinutes,
		isWeekend,
		addMinutes,
		setHours,
		setMinutes,
	} from 'date-fns';
	import { de, enUS, fr, es, it } from 'date-fns/locale';
	import { locale } from 'svelte-i18n';

	// Constants
	const HOUR_HEIGHT = 60; // px - should match CSS --hour-height
	const MINUTES_PER_SLOT = 15; // Snap to 15-minute intervals

	// Props
	interface Props {
		dayCount: 5 | 10 | 14;
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
	}
	let { dayCount, onQuickCreate }: Props = $props();

	// Get date-fns locale based on current app locale
	const dateLocales = { de, en: enUS, fr, es, it };
	let currentDateLocale = $derived(
		dateLocales[$locale?.substring(0, 2) as keyof typeof dateLocales] || de
	);

	// Generate days based on view range, optionally filtering weekends
	let allDays = $derived(
		eachDayOfInterval({
			start: viewStore.viewRange.start,
			end: viewStore.viewRange.end,
		})
	);

	let days = $derived(
		settingsStore.showOnlyWeekdays ? allDays.filter((day) => !isWeekend(day)) : allDays
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

	// Determine column width based on day count
	let columnClass = $derived.by(() => {
		if (days.length <= 5) return 'normal';
		if (days.length <= 10) return 'compact';
		return 'very-compact';
	});

	// ========== Drag & Drop State ==========
	let isDragging = $state(false);
	let draggedEvent = $state<any>(null);
	let dragOffsetMinutes = $state(0);
	let dragTargetDay = $state<Date | null>(null);
	let dragPreviewTop = $state(0);
	let dragPreviewHeight = $state(0);

	// ========== Resize State ==========
	let isResizing = $state(false);
	let resizeEvent = $state<any>(null);
	let resizeEdge = $state<'top' | 'bottom'>('bottom');
	let resizeOriginalStart = $state<Date | null>(null);
	let resizeOriginalEnd = $state<Date | null>(null);
	let resizePreviewTop = $state(0);
	let resizePreviewHeight = $state(0);

	// Track if we actually moved during drag/resize (to prevent click on simple mousedown/up)
	let hasMoved = $state(false);

	// Reference to the days container for position calculations
	let daysContainerEl: HTMLDivElement;

	function getEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).filter((e) => !e.isAllDay);
	}

	function getAllDayEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).filter((e) => e.isAllDay);
	}

	// Get display mode for an event (per-event override takes precedence over global setting)
	function getEventDisplayMode(event: any): 'header' | 'block' {
		return event.metadata?.allDayDisplayMode || settingsStore.allDayDisplayMode;
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

	function getEventStyle(event: any) {
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 2); // Min 2% height

		const color = calendarsStore.getColor(event.calendarId);

		return `top: ${top}%; height: ${height}%; background-color: ${color};`;
	}

	function formatEventTime(date: Date | string): string {
		const d = typeof date === 'string' ? parseISO(date) : date;
		return settingsStore.formatTime(d);
	}

	function handleEventClick(event: any, e: MouseEvent) {
		// Don't navigate if we just finished dragging or resizing, or if we moved
		if (isDragging || isResizing || hasMoved) {
			e.preventDefault();
			e.stopPropagation();
			setTimeout(() => {
				hasMoved = false;
			}, 100);
			return;
		}
		goto(`/?event=${event.id}`);
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

	function startDrag(event: any, e: PointerEvent) {
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

	// ========== Keyboard Handling ==========

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && (isDragging || isResizing)) {
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
	}

	$effect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div
	class="multi-day-view"
	class:compact={columnClass === 'compact'}
	class:very-compact={columnClass === 'very-compact'}
>
	<!-- All-day events row (only shown when there are header-mode all-day events) -->
	{#if hasAnyHeaderAllDayEvents}
		<div class="all-day-row">
			<div class="time-gutter"></div>
			{#each days as day}
				<div class="all-day-cell">
					{#each getHeaderAllDayEventsForDay(day) as event}
						<button
							class="all-day-event"
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							onclick={(e) => handleEventClick(event, e)}
							title={event.title}
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
				<span class="day-name"
					>{format(day, columnClass === 'very-compact' ? 'EEEEE' : 'EEE', { locale: de })}</span
				>
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
			{#each days as day}
				<div class="day-column" class:today={isToday(day)}>
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
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							onclick={(e) => handleEventClick(event, e)}
							title={event.title}
						>
							<span class="event-title">{event.title}</span>
						</button>
					{/each}

					<!-- Timed events -->
					{#each getEventsForDay(day) as event (event.id)}
						{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
						{@const isBeingResized = isResizing && resizeEvent?.id === event.id}
						{@const isDraft = eventsStore.isDraftEvent(event.id)}
						<div
							class="event-card"
							class:dragging={isBeingDragged}
							class:resizing={isBeingResized}
							class:draft={isDraft}
							data-event-id={event.id}
							style={isBeingDragged
								? `top: ${dragPreviewTop}%; height: ${dragPreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};`
								: isBeingResized
									? `top: ${resizePreviewTop}%; height: ${resizePreviewHeight}%; background-color: ${calendarsStore.getColor(event.calendarId)};`
									: getEventStyle(event)}
							role="button"
							tabindex="0"
							onpointerdown={(e) => startDrag(event, e)}
							onclick={(e) => !isDraft && handleEventClick(event, e)}
							onkeydown={(e) => !isDraft && e.key === 'Enter' && goto(`/?event=${event.id}`)}
							title={`${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}: ${event.title || (isDraft ? '(Neuer Termin)' : '')}`}
						>
							<!-- Top resize handle -->
							<div
								class="resize-handle top"
								onpointerdown={(e) => startResize(event, 'top', e)}
								role="separator"
								aria-orientation="horizontal"
								aria-label="Startzeit ändern"
							></div>

							{#if columnClass !== 'very-compact'}
								<span class="event-time">
									{formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
								</span>
							{/if}
							<span class="event-title">{event.title || (isDraft ? '(Neuer Termin)' : '')}</span>

							<!-- Bottom resize handle -->
							<div
								class="resize-handle bottom"
								onpointerdown={(e) => startResize(event, 'bottom', e)}
								role="separator"
								aria-orientation="horizontal"
								aria-label="Endzeit ändern"
							></div>
						</div>
					{/each}

					<!-- Drag preview ghost (for cross-day dragging) -->
					{#if isDragging && draggedEvent && dragTargetDay && isSameDay(day, dragTargetDay) && !getEventsForDay(day).some((e) => e.id === draggedEvent.id)}
						<div
							class="event-card drag-ghost"
							style="top: {dragPreviewTop}%; height: {dragPreviewHeight}%; background-color: {calendarsStore.getColor(
								draggedEvent.calendarId
							)};"
						>
							{#if columnClass !== 'very-compact'}
								<span class="event-time">{formatEventTime(draggedEvent.startTime)}</span>
							{/if}
							<span class="event-title">{draggedEvent.title}</span>
						</div>
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
	.multi-day-view {
		display: flex;
		flex-direction: column;
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
		min-width: 0;
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
		max-width: 100%;
	}

	.compact .all-day-event,
	.very-compact .all-day-event {
		padding: 2px 4px;
		font-size: 0.65rem;
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

	.compact .all-day-block-event,
	.very-compact .all-day-block-event {
		left: 1px;
		right: 1px;
		padding: 2px 4px;
	}

	.all-day-block-event:hover {
		opacity: 0.5;
	}

	.all-day-block-event .event-title {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.compact .all-day-block-event .event-title,
	.very-compact .all-day-block-event .event-title {
		font-size: 0.6rem;
	}

	.day-headers {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.time-gutter {
		width: var(--time-column-width);
		flex-shrink: 0;
	}

	.day-header {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		border-left: 1px solid hsl(var(--color-border));
		min-width: 0;
	}

	.compact .day-header {
		padding: 0.25rem;
	}

	.very-compact .day-header {
		padding: 0.125rem;
	}

	.day-name {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.compact .day-name,
	.very-compact .day-name {
		font-size: 0.65rem;
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

	.compact .day-number {
		font-size: 1rem;
		width: 28px;
		height: 28px;
	}

	.very-compact .day-number {
		font-size: 0.875rem;
		width: 24px;
		height: 24px;
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

	.compact .time-label,
	.very-compact .time-label {
		font-size: 0.65rem;
		padding-right: 0.25rem;
	}

	.days-container {
		flex: 1;
		display: flex;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border));
		min-width: 0;
	}

	.day-column.today {
		background: hsl(var(--color-primary) / 0.05);
	}

	.hour-slot {
		display: block;
		width: 100%;
		height: var(--hour-height);
		border: none;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		background: transparent;
		cursor: pointer;
	}

	.hour-slot:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.event-card {
		position: absolute;
		left: 2px;
		right: 2px;
		color: white;
		border: none;
		text-align: left;
		cursor: grab;
		z-index: 1;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
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

	.event-card.drag-ghost {
		opacity: 0.6;
		pointer-events: none;
		border: 2px dashed white;
	}

	.compact .event-card,
	.very-compact .event-card {
		left: 1px;
		right: 1px;
		padding: 1px 2px;
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

	/* Compact resize handles */
	.compact .resize-handle,
	.very-compact .resize-handle {
		height: 6px;
	}

	.event-time {
		font-size: 0.65rem;
		opacity: 0.9;
		display: block;
	}

	.compact .event-time {
		font-size: 0.6rem;
	}

	.event-title {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.compact .event-title {
		font-size: 0.65rem;
	}

	.very-compact .event-title {
		font-size: 0.6rem;
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
		border-radius: 50%;
		background: hsl(var(--color-error));
	}
</style>
