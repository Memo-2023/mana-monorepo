<script lang="ts">
	/**
	 * CalendarEventsWidget - Upcoming calendar events
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { calendarService, type CalendarEvent } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<CalendarEvent[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await calendarService.getUpcomingEvents(7);

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			// Don't retry if service is unavailable (network error)
			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function formatEventTime(event: CalendarEvent): string {
		const start = new Date(event.startTime);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		let dateStr = '';
		if (start.toDateString() === today.toDateString()) {
			dateStr = 'Heute';
		} else if (start.toDateString() === tomorrow.toDateString()) {
			dateStr = 'Morgen';
		} else {
			dateStr = start.toLocaleDateString('de-DE', {
				weekday: 'short',
				day: 'numeric',
				month: 'short',
			});
		}

		if (event.isAllDay) {
			return dateStr;
		}

		const timeStr = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		return `${dateStr}, ${timeStr}`;
	}

	const displayedEvents = $derived(data.slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, data.length - MAX_DISPLAY));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🗓️</span>
			{$_('dashboard.widgets.calendar.title')}
		</h3>
		{#if data.length > 0}
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
				{data.length}
			</span>
		{/if}
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📅</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.calendar.empty')}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each displayedEvents as event}
				<div class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover">
					<div
						class="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
						style="background-color: {event.color || '#3B82F6'}"
					></div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{event.title}</p>
						<p class="text-xs text-muted-foreground">{formatEventTime(event)}</p>
						{#if event.location}
							<p class="truncate text-xs text-muted-foreground">📍 {event.location}</p>
						{/if}
					</div>
				</div>
			{/each}

			{#if remainingCount > 0}
				<a
					href="http://localhost:5179"
					target="_blank"
					rel="noopener"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					+{remainingCount} weitere
				</a>
			{/if}
		</div>
	{/if}
</div>
