<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import TodoDayCell from './TodoDayCell.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		startOfMonth,
		endOfMonth,
		startOfWeek,
		endOfWeek,
		eachDayOfInterval,
		isSameMonth,
		isToday,
		isSameDay,
		isWeekend,
		setYear,
		setMonth,
		setDate,
		getHours,
		getMinutes,
		differenceInMinutes,
		addMinutes,
		setHours,
		setMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';
	import { _ } from 'svelte-i18n';

	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
		onEventClick?: (event: CalendarEvent) => void;
	}

	let { onQuickCreate, onEventClick }: Props = $props();

	// Get all days to display in the month grid (including days from prev/next months)
	let allCalendarDays = $derived.by(() => {
		const monthStart = startOfMonth(viewStore.currentDate);
		const monthEnd = endOfMonth(viewStore.currentDate);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: settingsStore.weekStartsOn });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: settingsStore.weekStartsOn });

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	});

	// Filter weekends if option is active
	let calendarDays = $derived(
		settingsStore.showOnlyWeekdays
			? allCalendarDays.filter((day) => !isWeekend(day))
			: allCalendarDays
	);

	// Week day headers - depends on week start setting
	const weekDaysFromMonday = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	const weekDaysFromSunday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	let allWeekDays = $derived(
		settingsStore.weekStartsOn === 1 ? weekDaysFromMonday : weekDaysFromSunday
	);
	let weekDays = $derived(settingsStore.showOnlyWeekdays ? allWeekDays.slice(0, 5) : allWeekDays);

	// Number of columns for grid
	let columnCount = $derived(settingsStore.showOnlyWeekdays ? 5 : 7);

	// Group days into weeks
	let weeks = $derived.by(() => {
		const result: Date[][] = [];
		for (let i = 0; i < calendarDays.length; i += columnCount) {
			result.push(calendarDays.slice(i, i + columnCount));
		}
		return result;
	});

	// ============================================================================
	// Drag & Drop State
	// ============================================================================
	let isDragging = $state(false);
	let draggedEvent = $state<any>(null);
	let dragTargetDay = $state<Date | null>(null);
	let monthViewRef = $state<HTMLElement | null>(null);

	// Store for day cell refs
	let dayCellRefs = $state<Map<string, HTMLElement>>(new Map());

	function setDayCellRef(day: Date, el: HTMLElement | null) {
		const key = format(day, 'yyyy-MM-dd');
		if (el) {
			dayCellRefs.set(key, el);
		} else {
			dayCellRefs.delete(key);
		}
	}

	// Svelte action for binding day cell refs
	function bindDayCellRef(node: HTMLElement, day: Date) {
		setDayCellRef(day, node);
		return {
			destroy() {
				setDayCellRef(day, null);
			},
		};
	}

	// ============================================================================
	// Helper Functions
	// ============================================================================
	function getDayFromPoint(x: number, y: number): Date | null {
		for (const [key, el] of dayCellRefs) {
			const rect = el.getBoundingClientRect();
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				return new Date(key);
			}
		}
		return null;
	}

	// ============================================================================
	// Drag Handlers
	// ============================================================================
	function startDrag(event: any, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		isDragging = true;
		draggedEvent = event;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;

		const targetDay = getDayFromPoint(e.clientX, e.clientY);
		dragTargetDay = targetDay;
	}

	function handleDragEnd(e: PointerEvent) {
		if (!isDragging || !draggedEvent) {
			cleanup();
			return;
		}

		const targetDay = getDayFromPoint(e.clientX, e.clientY);

		if (targetDay) {
			const start =
				typeof draggedEvent.startTime === 'string'
					? new Date(draggedEvent.startTime)
					: draggedEvent.startTime;
			const end =
				typeof draggedEvent.endTime === 'string'
					? new Date(draggedEvent.endTime)
					: draggedEvent.endTime;
			const duration = differenceInMinutes(end, start);

			// Keep the same time, change the date
			let newStart = new Date(targetDay);
			newStart.setHours(getHours(start), getMinutes(start), 0, 0);

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
		}

		cleanup();
	}

	function cleanup() {
		isDragging = false;
		draggedEvent = null;
		dragTargetDay = null;
		document.removeEventListener('pointermove', handleDragMove);
		document.removeEventListener('pointerup', handleDragEnd);
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================
	function getEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).slice(0, 3); // Max 3 events shown
	}

	function handleDayClick(day: Date, e: MouseEvent) {
		// Don't navigate if dragging
		if (isDragging) return;

		// If onQuickCreate callback provided, open quick event overlay
		if (onQuickCreate) {
			// Set start time to current hour (or 9 AM if in the past)
			const now = new Date();
			let startTime = setMinutes(setHours(day, now.getHours()), 0);

			// If the selected day is today and current hour is reasonable, use next hour
			if (isSameDay(day, now)) {
				startTime = setMinutes(setHours(day, now.getHours() + 1), 0);
			} else {
				// For other days, default to 9 AM
				startTime = setMinutes(setHours(day, 9), 0);
			}

			onQuickCreate(startTime, { x: e.clientX, y: e.clientY });
		} else {
			// Fallback: navigate to day view
			viewStore.setDate(day);
			viewStore.setViewType('day');
		}
	}

	function handleEventClick(event: CalendarEvent, e: MouseEvent) {
		// Don't navigate if dragging
		if (isDragging) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		e.stopPropagation();
		if (onEventClick) {
			onEventClick(event);
		} else {
			goto(`/?event=${event.id}`);
		}
	}

	function handleMoreClick(day: Date, e: MouseEvent) {
		e.stopPropagation();
		viewStore.setDate(day);
		viewStore.setViewType('day');
	}
</script>

<div class="month-view" style="--column-count: {columnCount}" bind:this={monthViewRef}>
	<!-- Week day headers -->
	<div class="weekday-headers">
		{#each weekDays as day}
			<div class="weekday-header">{day}</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="calendar-grid">
		{#each weeks as week}
			<div class="week-row">
				{#each week as day}
					{@const isDropTarget = isDragging && dragTargetDay && isSameDay(day, dragTargetDay)}
					<div
						class="day-cell"
						class:other-month={!isSameMonth(day, viewStore.currentDate)}
						class:today={isToday(day)}
						class:drop-target={isDropTarget}
						use:bindDayCellRef={day}
						onclick={(e) => handleDayClick(day, e)}
						onkeydown={(e) => e.key === 'Enter' && handleDayClick(day, e as unknown as MouseEvent)}
						role="button"
						tabindex="0"
						aria-label={$_('a11y.createEventOn', {
							values: { date: format(day, 'EEEE, d. MMMM', { locale: de }) },
						})}
					>
						<span class="day-number" class:today={isToday(day)}>
							{format(day, 'd')}
						</span>

						<!-- Todos for this day -->
						{#if todosStore.serviceAvailable}
							<TodoDayCell date={day} maxVisible={2} />
						{/if}

						<div class="day-events">
							{#each getEventsForDay(day) as event}
								{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
								{@const isDraft = eventsStore.isDraftEvent(event.id)}
								<div
									class="event-pill"
									class:dragging={isBeingDragged}
									class:draft={isDraft}
									data-event-id={event.id}
									style="background-color: {calendarsStore.getColor(event.calendarId)}"
									onpointerdown={(e) => startDrag(event, e)}
									onclick={(e) => !isDraft && handleEventClick(event, e)}
									role="button"
									tabindex="0"
								>
									{#if !event.isAllDay}
										<span class="event-time"
											>{format(
												typeof event.startTime === 'string'
													? new Date(event.startTime)
													: event.startTime,
												'HH:mm'
											)}-{format(
												typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime,
												'HH:mm'
											)}</span
										>
									{/if}
									<span class="event-title"
										>{event.title || (isDraft ? $_('calendar.draftEvent') : '')}</span
									>
								</div>
							{/each}

							{#if eventsStore.getEventsForDay(day).length > 3}
								<button class="more-events" onclick={(e) => handleMoreClick(day, e)}>
									{$_('views.moreEvents', {
										values: { count: eventsStore.getEventsForDay(day).length - 3 },
									})}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.month-view {
		display: flex;
		flex-direction: column;
	}

	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(var(--column-count, 7), 1fr);
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.weekday-header {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.calendar-grid {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.week-row {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(var(--column-count, 7), 1fr);
		min-height: 100px;
	}

	.day-cell {
		border: 1px solid hsl(var(--color-border));
		border-top: none;
		border-left: none;
		padding: var(--spacing-xs);
		background: transparent;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		transition: background-color var(--transition-fast);
	}

	.day-cell:first-child {
		border-left: 1px solid hsl(var(--color-border));
	}

	.day-cell:hover {
		background-color: hsl(var(--color-muted) / 0.3);
	}

	.day-cell.today {
		background-color: hsl(var(--color-primary) / 0.1);
	}

	.day-cell.other-month {
		opacity: 0.5;
	}

	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		margin-bottom: 0.25rem;
	}

	.day-number.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.day-events {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}

	.event-pill {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		font-size: 0.75rem;
		color: white;
		border-radius: var(--radius-sm);
		border: none;
		cursor: grab;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		touch-action: none;
		user-select: none;
		transition:
			transform 150ms ease,
			box-shadow 150ms ease,
			opacity 150ms ease;
	}

	.event-pill:hover {
		transform: scale(1.02);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.event-pill.dragging {
		cursor: grabbing;
		opacity: 0.5;
		transform: scale(0.95);
	}

	.event-pill.draft {
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
	}

	.event-title {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.more-events {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 2px;
		text-align: left;
	}

	.more-events:hover {
		color: hsl(var(--color-primary));
	}

	/* Drop target highlighting */
	.day-cell.drop-target {
		background-color: hsl(var(--color-primary) / 0.2) !important;
		outline: 2px dashed hsl(var(--color-primary));
		outline-offset: -2px;
	}
</style>
