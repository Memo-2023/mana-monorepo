<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';

	let loading = $state(true);

	// Group events by date
	let groupedEvents = $derived.by(() => {
		const groups: Map<string, typeof eventsStore.events> = new Map();

		for (const event of eventsStore.events) {
			const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
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

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch events for next 30 days
		const start = startOfDay(new Date());
		const end = endOfDay(addDays(start, 30));
		await eventsStore.fetchEvents(start, end);
		loading = false;
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

	function handleEventClick(eventId: string) {
		goto(`/event/${eventId}`);
	}
</script>

<svelte:head>
	<title>Agenda | Kalender</title>
</svelte:head>

<div class="agenda-page">
	<header class="page-header">
		<h1>Agenda</h1>
		<p class="subtitle">Ihre kommenden Termine</p>
	</header>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if groupedEvents.length === 0}
		<div class="empty-state card">
			<p>Keine Termine in den nächsten 30 Tagen</p>
			<button class="btn btn-primary" onclick={() => goto('/event/new')}>
				Termin erstellen
			</button>
		</div>
	{:else}
		<div class="event-list">
			{#each groupedEvents as group}
				<div class="date-group">
					<h2 class="date-header" class:today={isToday(group.date)}>
						{formatDateHeader(group.date)}
					</h2>

					{#each group.events as event}
						<button class="event-item card" onclick={() => handleEventClick(event.id)}>
							<div
								class="color-bar"
								style="background-color: {calendarsStore.getColor(event.calendarId)}"
							></div>
							<div class="event-content">
								<div class="event-time">
									{#if event.isAllDay}
										Ganztägig
									{:else}
										{format(typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime, 'HH:mm')} -
										{format(typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime, 'HH:mm')}
									{/if}
								</div>
								<div class="event-title">{event.title}</div>
								{#if event.location}
									<div class="event-location">{event.location}</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.agenda-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.25rem 0;
	}

	.subtitle {
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--muted-foreground));
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
	}

	.empty-state p {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
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
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		padding-left: 0.5rem;
	}

	.date-header.today {
		color: hsl(var(--primary));
	}

	.event-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		cursor: pointer;
		border: none;
		text-align: left;
		width: 100%;
		transition: transform var(--transition-fast);
	}

	.event-item:hover {
		transform: translateX(4px);
	}

	.color-bar {
		width: 4px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-time {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.25rem;
	}

	.event-title {
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-location {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.25rem;
	}
</style>
