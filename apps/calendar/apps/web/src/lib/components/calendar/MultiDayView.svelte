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
		parseISO,
		differenceInMinutes,
		isWeekend,
	} from 'date-fns';
	import { de } from 'date-fns/locale';

	// Props
	interface Props {
		dayCount: 5 | 10 | 14;
	}
	let { dayCount }: Props = $props();

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

	// Generate hours (0-23)
	let hours = Array.from({ length: 24 }, (_, i) => i);

	// Current time indicator position
	let now = $state(new Date());
	let currentTimePosition = $derived.by(() => {
		const minutes = now.getHours() * 60 + now.getMinutes();
		return (minutes / (24 * 60)) * 100;
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

	function getEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).filter((e) => !e.isAllDay);
	}

	function getAllDayEventsForDay(day: Date) {
		return eventsStore.getEventsForDay(day).filter((e) => e.isAllDay);
	}

	function getEventStyle(event: any) {
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const top = (startMinutes / (24 * 60)) * 100;
		const height = Math.max((duration / (24 * 60)) * 100, 2); // Min 2% height

		const color = calendarsStore.getColor(event.calendarId);

		return `top: ${top}%; height: ${height}%; background-color: ${color};`;
	}

	function handleEventClick(event: any) {
		goto(`/event/${event.id}`);
	}

	function handleSlotClick(day: Date, hour: number) {
		const startTime = new Date(day);
		startTime.setHours(hour, 0, 0, 0);
		goto(`/event/new?start=${startTime.toISOString()}`);
	}
</script>

<div class="multi-day-view" class:compact={columnClass === 'compact'} class:very-compact={columnClass === 'very-compact'}>
	<!-- All-day events row -->
	<div class="all-day-row">
		<div class="time-gutter"></div>
		{#each days as day}
			<div class="all-day-cell">
				{#each getAllDayEventsForDay(day) as event}
					<button
						class="all-day-event"
						style="background-color: {calendarsStore.getColor(event.calendarId)}"
						onclick={() => handleEventClick(event)}
						title={event.title}
					>
						{event.title}
					</button>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Day headers -->
	<div class="day-headers">
		<div class="time-gutter"></div>
		{#each days as day}
			<div class="day-header" class:today={isToday(day)}>
				<span class="day-name">{format(day, columnClass === 'very-compact' ? 'EEEEE' : 'EEE', { locale: de })}</span>
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
		<div class="days-container">
			{#each days as day}
				<div class="day-column" class:today={isToday(day)}>
					{#each hours as hour}
						<button
							class="hour-slot"
							onclick={() => handleSlotClick(day, hour)}
							aria-label={`${format(day, 'EEEE', { locale: de })} ${hour}:00 Uhr`}
						></button>
					{/each}

					<!-- Events -->
					{#each getEventsForDay(day) as event}
						<button
							class="event-card"
							style={getEventStyle(event)}
							onclick={() => handleEventClick(event)}
							title={`${format(typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime, 'HH:mm')} - ${event.title}`}
						>
							{#if columnClass !== 'very-compact'}
								<span class="event-time">
									{format(typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime, 'HH:mm')}
								</span>
							{/if}
							<span class="event-title">{event.title}</span>
						</button>
					{/each}

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
		height: 100%;
		min-height: 0;
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
		overflow-y: auto;
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
		cursor: pointer;
		z-index: 1;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.compact .event-card,
	.very-compact .event-card {
		left: 1px;
		right: 1px;
		padding: 1px 2px;
	}

	.event-time {
		font-size: 0.65rem;
		opacity: 0.9;
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
		background: hsl(var(--color-destructive));
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
		background: hsl(var(--color-destructive));
	}
</style>
