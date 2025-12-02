<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
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
	} from 'date-fns';
	import { de } from 'date-fns/locale';

	// Get all days to display in the month grid (including days from prev/next months)
	let calendarDays = $derived.by(() => {
		const monthStart = startOfMonth(viewStore.currentDate);
		const monthEnd = endOfMonth(viewStore.currentDate);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	});

	// Week day headers
	const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	// Group days into weeks
	let weeks = $derived.by(() => {
		const result: Date[][] = [];
		for (let i = 0; i < calendarDays.length; i += 7) {
			result.push(calendarDays.slice(i, i + 7));
		}
		return result;
	});

	function getEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).slice(0, 3); // Max 3 events shown
	}

	function handleDayClick(day: Date) {
		viewStore.setDate(day);
		viewStore.setViewType('day');
	}

	function handleEventClick(event: any, e: MouseEvent) {
		e.stopPropagation();
		goto(`/event/${event.id}`);
	}

	function handleMoreClick(day: Date, e: MouseEvent) {
		e.stopPropagation();
		viewStore.setDate(day);
		viewStore.setViewType('day');
	}
</script>

<div class="month-view">
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
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="day-cell"
						class:other-month={!isSameMonth(day, viewStore.currentDate)}
						class:today={isToday(day)}
						onclick={() => handleDayClick(day)}
						onkeydown={(e) => e.key === 'Enter' && handleDayClick(day)}
						role="button"
						tabindex="0"
					>
						<span class="day-number" class:today={isToday(day)}>
							{format(day, 'd')}
						</span>

						<div class="day-events">
							{#each getEventsForDay(day) as event}
								<button
									class="event-pill"
									style="background-color: {calendarsStore.getColor(event.calendarId)}"
									onclick={(e) => handleEventClick(event, e)}
								>
									{#if !event.isAllDay}
										<span class="event-time">{format(typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime, 'HH:mm')}</span>
									{/if}
									<span class="event-title">{event.title}</span>
								</button>
							{/each}

							{#if eventsStore.getEventsForDay(day).length > 3}
								<button
									class="more-events"
									onclick={(e) => handleMoreClick(day, e)}
								>
									+{eventsStore.getEventsForDay(day).length - 3} mehr
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
	}

	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
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
		grid-template-columns: repeat(7, 1fr);
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
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
