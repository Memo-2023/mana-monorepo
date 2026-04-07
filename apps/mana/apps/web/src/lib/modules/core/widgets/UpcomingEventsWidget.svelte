<script lang="ts">
	/**
	 * UpcomingEventsWidget — Termine der nächsten 7 Tage.
	 *
	 * Liest direkt aus der unified IndexedDB (events + calendars tables).
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { BaseRecord } from '@mana/local-store';

	interface CalendarEvent extends BaseRecord {
		calendarId: string;
		title: string;
		startDate: string;
		endDate: string;
		allDay: boolean;
		location?: string | null;
		color?: string | null;
	}

	interface Calendar extends BaseRecord {
		name: string;
		color: string;
		isVisible: boolean;
	}

	let events: (CalendarEvent & { calendarColor: string })[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const now = new Date();
			const future = new Date(now);
			future.setDate(future.getDate() + 7);
			const nowStr = now.toISOString();
			const futureStr = future.toISOString();

			const [rawEvents, calendars] = await Promise.all([
				db.table<CalendarEvent>('events').toArray(),
				db.table<Calendar>('calendars').toArray(),
			]);

			const calendarMap = new Map(calendars.map((c) => [c.id, c]));

			// title/description/location are encrypted on disk; the widget
			// renders title + location, so decrypt before further filtering.
			const allEvents = await decryptRecords('events', rawEvents);

			return allEvents
				.filter((e) => {
					if (e.deletedAt) return false;
					const cal = calendarMap.get(e.calendarId);
					if (cal && !cal.isVisible) return false;
					return e.startDate >= nowStr && e.startDate <= futureStr;
				})
				.sort((a, b) => a.startDate.localeCompare(b.startDate))
				.map((e) => ({
					...e,
					calendarColor: e.color || calendarMap.get(e.calendarId)?.color || '#3B82F6',
				}));
		}).subscribe({
			next: (val) => {
				events = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const MAX_DISPLAY = 5;
	const displayed = $derived(events.slice(0, MAX_DISPLAY));
	const remaining = $derived(Math.max(0, events.length - MAX_DISPLAY));

	function formatEventTime(event: CalendarEvent): string {
		const start = new Date(event.startDate);
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

		if (event.allDay) return dateStr;

		const timeStr = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		return `${dateStr}, ${timeStr}`;
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Termine</h3>
		{#if events.length > 0}
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
				{events.length}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if events.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#128197;</div>
			<p class="text-sm text-muted-foreground">Keine Termine in den nächsten 7 Tagen.</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each displayed as event (event.id)}
				<a
					href="/calendar"
					class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div
						class="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
						style="background-color: {event.calendarColor}"
					></div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{event.title}</p>
						<p class="text-xs text-muted-foreground">{formatEventTime(event)}</p>
						{#if event.location}
							<p class="truncate text-xs text-muted-foreground">&#128205; {event.location}</p>
						{/if}
					</div>
				</a>
			{/each}

			{#if remaining > 0}
				<a
					href="/calendar"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					+{remaining} weitere Termine
				</a>
			{/if}
		</div>
	{/if}
</div>
