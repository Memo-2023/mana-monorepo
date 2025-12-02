<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { goto } from '$app/navigation';
	import {
		format,
		isToday,
		parseISO,
		differenceInMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';

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

	let timedEvents = $derived(
		eventsStore.getEventsForDay(viewStore.currentDate).filter((e) => !e.isAllDay)
	);

	let allDayEvents = $derived(
		eventsStore.getEventsForDay(viewStore.currentDate).filter((e) => e.isAllDay)
	);

	function getEventStyle(event: any) {
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const top = (startMinutes / (24 * 60)) * 100;
		const height = Math.max((duration / (24 * 60)) * 100, 2);

		const color = calendarsStore.getColor(event.calendarId);

		return `top: ${top}%; height: ${height}%; background-color: ${color};`;
	}

	function handleEventClick(event: any) {
		goto(`/event/${event.id}`);
	}

	function handleSlotClick(hour: number) {
		const startTime = new Date(viewStore.currentDate);
		startTime.setHours(hour, 0, 0, 0);
		goto(`/event/new?start=${startTime.toISOString()}`);
	}
</script>

<div class="day-view">
	<!-- All-day events -->
	{#if allDayEvents.length > 0}
		<div class="all-day-section">
			<div class="time-gutter">
				<span class="all-day-label">Ganztägig</span>
			</div>
			<div class="all-day-events">
				{#each allDayEvents as event}
					<button
						class="all-day-event"
						style="background-color: {calendarsStore.getColor(event.calendarId)}"
						onclick={() => handleEventClick(event)}
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

		<div class="day-column" class:today={isToday(viewStore.currentDate)}>
			{#each hours as hour}
				<button
					class="hour-slot"
					onclick={() => handleSlotClick(hour)}
					aria-label={`${hour}:00 Uhr`}
				></button>
			{/each}

			<!-- Events -->
			{#each timedEvents as event}
				<button
					class="event-card"
					style={getEventStyle(event)}
					onclick={() => handleEventClick(event)}
				>
					<span class="event-time">
						{format(typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime, 'HH:mm')} -
						{format(typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime, 'HH:mm')}
					</span>
					<span class="event-title">{event.title}</span>
					{#if event.location}
						<span class="event-location">{event.location}</span>
					{/if}
				</button>
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
		height: 100%;
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
		cursor: pointer;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
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
</style>
