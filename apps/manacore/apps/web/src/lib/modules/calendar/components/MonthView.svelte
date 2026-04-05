<script lang="ts">
	import { getContext } from 'svelte';
	import { calendarViewStore } from '../stores/view.svelte';
	import { eventsStore } from '../stores/events.svelte';
	import {
		filterEventsByVisibleCalendars,
		getEventsForDay,
		getEventsInRange,
		getCalendarColor,
	} from '../queries';
	import type { Calendar, CalendarEvent } from '../types';
	import { toDate } from '../utils/event-date-helpers';
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
		differenceInMinutes,
		addMinutes,
		setHours,
		setMinutes,
		getHours,
		getMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		onEventClick?: (event: CalendarEvent) => void;
		onDayClick?: (day: Date) => void;
	}

	let { onEventClick, onDayClick }: Props = $props();

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');
	const eventsCtx: { readonly value: CalendarEvent[] } = getContext('calendarEvents');

	let allCalendarDays = $derived.by(() => {
		const monthStart = startOfMonth(calendarViewStore.currentDate);
		const monthEnd = endOfMonth(calendarViewStore.currentDate);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	});

	let rangeEvents = $derived.by(() => {
		if (allCalendarDays.length === 0) return [];
		const filtered = filterEventsByVisibleCalendars(eventsCtx.value, calendarsCtx.value).filter(
			(e) => calendarViewStore.visibleBlockTypes.has(e.blockType)
		);
		return getEventsInRange(
			filtered,
			allCalendarDays[0],
			allCalendarDays[allCalendarDays.length - 1]
		);
	});

	function getItemColor(event: CalendarEvent): string {
		if (event.calendarId !== '__external__') {
			return getCalendarColor(calendarsCtx.value, event.calendarId);
		}
		return event.color || '#6b7280';
	}

	const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	let weeks = $derived.by(() => {
		const result: Date[][] = [];
		for (let i = 0; i < allCalendarDays.length; i += 7) {
			result.push(allCalendarDays.slice(i, i + 7));
		}
		return result;
	});

	// Drag & Drop
	let isDragging = $state(false);
	let draggedEvent = $state<CalendarEvent | null>(null);
	let dragTargetDay = $state<Date | null>(null);
	let dayCellRefs = $state<Map<string, HTMLElement>>(new Map());

	function bindDayCellRef(node: HTMLElement, day: Date) {
		const key = format(day, 'yyyy-MM-dd');
		dayCellRefs.set(key, node);
		return {
			destroy() {
				dayCellRefs.delete(key);
			},
		};
	}

	function getDayFromPoint(x: number, y: number): Date | null {
		for (const [key, el] of dayCellRefs) {
			const rect = el.getBoundingClientRect();
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				return new Date(key);
			}
		}
		return null;
	}

	function startDrag(event: CalendarEvent, e: PointerEvent) {
		e.preventDefault();
		e.stopPropagation();

		isDragging = true;
		draggedEvent = event;

		document.addEventListener('pointermove', handleDragMove);
		document.addEventListener('pointerup', handleDragEnd);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging || !draggedEvent) return;
		dragTargetDay = getDayFromPoint(e.clientX, e.clientY);
	}

	function handleDragEnd(e: PointerEvent) {
		if (!isDragging || !draggedEvent) {
			cleanup();
			return;
		}

		const targetDay = getDayFromPoint(e.clientX, e.clientY);
		if (targetDay) {
			const start = toDate(draggedEvent.startTime);
			const end = toDate(draggedEvent.endTime);
			const duration = differenceInMinutes(end, start);

			let newStart = new Date(targetDay);
			newStart.setHours(getHours(start), getMinutes(start), 0, 0);
			const newEnd = addMinutes(newStart, duration);

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

	function getEventsForDayFiltered(day: Date): CalendarEvent[] {
		return getEventsForDay(rangeEvents, day).slice(0, 3);
	}

	function getAllEventsForDay(day: Date): CalendarEvent[] {
		return getEventsForDay(rangeEvents, day);
	}

	function handleDayClick(day: Date, e: MouseEvent) {
		if (isDragging) return;
		if (onDayClick) {
			onDayClick(day);
		} else {
			calendarViewStore.setDate(day);
			calendarViewStore.setViewType('week');
		}
	}

	function handleEventClick(event: CalendarEvent, e: MouseEvent) {
		if (isDragging) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		e.stopPropagation();
		onEventClick?.(event);
	}

	function handleMoreClick(day: Date, e: MouseEvent) {
		e.stopPropagation();
		calendarViewStore.setDate(day);
		calendarViewStore.setViewType('week');
	}
</script>

<div class="month-view">
	<!-- Week day headers -->
	<div class="weekday-headers" role="row">
		{#each weekDays as day}
			<div class="weekday-header" role="columnheader">{day}</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="calendar-grid" role="grid" aria-label="Monatsansicht">
		{#each weeks as week}
			<div class="week-row" role="row">
				{#each week as day}
					{@const isDropTarget = isDragging && dragTargetDay && isSameDay(day, dragTargetDay)}
					<div
						class="day-cell"
						class:other-month={!isSameMonth(day, calendarViewStore.currentDate)}
						class:today={isToday(day)}
						class:drop-target={isDropTarget}
						use:bindDayCellRef={day}
						onclick={(e) => handleDayClick(day, e)}
						onkeydown={(e) => e.key === 'Enter' && handleDayClick(day, e as unknown as MouseEvent)}
						role="gridcell"
						tabindex="0"
						aria-selected={isToday(day)}
					>
						<div class="day-header">
							<span class="day-number" class:today={isToday(day)}>
								{format(day, 'd')}
							</span>
						</div>

						<div class="day-events">
							{#each getEventsForDayFiltered(day) as event}
								{@const isBeingDragged = isDragging && draggedEvent?.id === event.id}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<div
									class="event-pill"
									class:dragging={isBeingDragged}
									data-event-id={event.id}
									style="background-color: {getItemColor(event)}"
									onpointerdown={(e) => startDrag(event, e)}
									onclick={(e) => handleEventClick(event, e)}
									role="button"
									tabindex="0"
									aria-label={event.title}
								>
									{#if !event.isAllDay}
										<span class="event-time">{format(toDate(event.startTime), 'HH:mm')}</span>
									{/if}
									<span class="event-title">{event.title}</span>
								</div>
							{/each}

							{#if getAllEventsForDay(day).length > 3}
								<button class="more-events" onclick={(e) => handleMoreClick(day, e)}>
									+{getAllEventsForDay(day).length - 3} weitere
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
		height: 100%;
		min-height: 0;
	}

	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		position: sticky;
		top: 0;
		z-index: 10;
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
		min-height: 0;
	}

	.week-row {
		flex: 1 1 0;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		min-height: 0;
	}

	.day-cell {
		border: 1px solid hsl(var(--color-border));
		border-top: none;
		border-left: none;
		padding: 0.25rem;
		background: transparent;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		transition: background-color 0.15s ease;
		min-height: 0;
		overflow: hidden;
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

	.day-cell.drop-target {
		background-color: hsl(var(--color-primary) / 0.2) !important;
		outline: 2px dashed hsl(var(--color-primary));
		outline-offset: -2px;
	}

	.day-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.25rem;
	}

	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
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
		border-radius: var(--radius-sm, 4px);
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
</style>
