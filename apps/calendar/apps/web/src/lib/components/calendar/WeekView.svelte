<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		eachDayOfInterval,
		eachHourOfInterval,
		startOfDay,
		endOfDay,
		isSameDay,
		isToday,
		parseISO,
		differenceInMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';

	// Generate days of the week
	let days = $derived(
		eachDayOfInterval({
			start: viewStore.viewRange.start,
			end: viewStore.viewRange.end,
		})
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

<div class="week-view">
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
				<span class="day-name">{format(day, 'EEE', { locale: de })}</span>
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
					{hour.toString().padStart(2, '0')}:00
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		<div class="days-container">
			{#each days as day, dayIndex}
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
						>
							<span class="event-time">
								{format(
									typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime,
									'HH:mm'
								)}
							</span>
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
	.week-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.all-day-row {
		display: flex;
		border-bottom: 1px solid hsl(var(--border));
		min-height: 32px;
	}

	.all-day-cell {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 4px;
		border-left: 1px solid hsl(var(--border));
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
	}

	.day-headers {
		display: flex;
		border-bottom: 1px solid hsl(var(--border));
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
		border-left: 1px solid hsl(var(--border));
	}

	.day-name {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
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
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
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
		color: hsl(var(--muted-foreground));
		position: relative;
		top: -0.5em;
	}

	.days-container {
		flex: 1;
		display: flex;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--border));
	}

	.day-column.today {
		background: hsl(var(--primary) / 0.05);
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
	}

	.event-time {
		font-size: 0.65rem;
		opacity: 0.9;
	}

	.event-title {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
