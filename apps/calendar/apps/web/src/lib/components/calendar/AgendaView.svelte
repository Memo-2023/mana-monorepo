<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { format, parseISO, isToday, isTomorrow, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onEventClick?: (event: CalendarEvent) => void;
	}

	let { onEventClick }: Props = $props();

	// Group events by date
	let groupedEvents = $derived.by(() => {
		const currentEvents = eventsStore.events ?? [];
		if (!Array.isArray(currentEvents)) return [];

		// Filter events that start from current date onwards
		const startDate = startOfDay(viewStore.currentDate);

		const groups: Map<string, CalendarEvent[]> = new Map();

		for (const event of currentEvents) {
			const start =
				typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;

			// Skip events before the start date
			if (start < startDate) continue;

			const dateKey = format(start, 'yyyy-MM-dd');

			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(event);
		}

		// Sort groups by date
		return Array.from(groups.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateKey, events]) => ({
				date: parseISO(dateKey),
				events: events.sort((a, b) => {
					const aStart = typeof a.startTime === 'string' ? parseISO(a.startTime) : a.startTime;
					const bStart = typeof b.startTime === 'string' ? parseISO(b.startTime) : b.startTime;
					return aStart.getTime() - bStart.getTime();
				}),
			}));
	});

	function formatDateHeader(date: Date) {
		if (isToday(date)) {
			return 'Heute';
		}
		if (isTomorrow(date)) {
			return 'Morgen';
		}
		return format(date, 'EEEE, d. MMMM', { locale: de });
	}

	function handleEventClick(event: CalendarEvent) {
		if (onEventClick) {
			onEventClick(event);
		}
	}
</script>

<div class="agenda-view">
	{#if groupedEvents.length === 0}
		<div class="empty-state">
			<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
			<p>Keine Termine in diesem Zeitraum</p>
		</div>
	{:else}
		<div class="event-list">
			{#each groupedEvents as group}
				<div class="date-group">
					<h2 class="date-header" class:today={isToday(group.date)}>
						{formatDateHeader(group.date)}
					</h2>

					<div class="events-for-date">
						{#each group.events as event}
							<button class="event-item" onclick={() => handleEventClick(event)}>
								<div
									class="color-bar"
									style="background-color: {calendarsStore.getColor(event.calendarId)}"
								></div>
								<div class="event-content">
									<div class="event-time">
										{#if event.isAllDay}
											Ganztägig
										{:else}
											{format(
												typeof event.startTime === 'string'
													? parseISO(event.startTime)
													: event.startTime,
												'HH:mm'
											)} - {format(
												typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime,
												'HH:mm'
											)}
										{/if}
									</div>
									<div class="event-title">{event.title}</div>
									{#if event.location}
										<div class="event-location">
											<svg
												class="location-icon"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											{event.location}
										</div>
									{/if}
								</div>
								<svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.agenda-view {
		padding: 1rem;
		max-width: 700px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}

	.empty-icon {
		width: 4rem;
		height: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state p {
		font-size: 1rem;
		margin: 0;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.date-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-header {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		padding-left: 0.5rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.date-header.today {
		color: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.events-for-date {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.event-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		cursor: pointer;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		text-align: left;
		width: 100%;
		background: hsl(var(--color-surface));
		transition:
			transform 150ms ease,
			box-shadow 150ms ease,
			border-color 150ms ease;
	}

	.event-item:hover {
		transform: translateX(4px);
		border-color: hsl(var(--color-border-hover, var(--color-border)));
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.color-bar {
		width: 4px;
		align-self: stretch;
		border-radius: 2px;
		flex-shrink: 0;
		min-height: 2.5rem;
	}

	.event-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.event-time {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}

	.event-title {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.location-icon {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.5;
		flex-shrink: 0;
	}

	.event-item:hover .chevron-icon {
		opacity: 1;
	}
</style>
