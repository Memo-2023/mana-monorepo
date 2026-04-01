<!--
  Calendar — Split-Screen AppView
  Mini week view with today's events.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalEvent } from './types';

	let events = $state<LocalEvent[]>([]);

	const now = new Date();
	const todayStr = now.toISOString().split('T')[0];

	const weekDays = $derived(() => {
		const days: Date[] = [];
		const start = new Date(now);
		start.setDate(start.getDate() - start.getDay() + 1); // Monday
		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			days.push(d);
		}
		return days;
	});

	const todayEvents = $derived(
		events
			.filter((e) => e.startDate.startsWith(todayStr))
			.sort((a, b) => a.startDate.localeCompare(b.startDate))
	);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalEvent>('events')
				.toArray()
				.then((all) => all.filter((e) => !e.deletedAt));
		}).subscribe((val) => {
			events = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}

	const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<!-- Mini week strip -->
	<div class="grid grid-cols-7 gap-1">
		{#each weekDays() as day, i}
			{@const isToday = day.toISOString().split('T')[0] === todayStr}
			<div class="flex flex-col items-center gap-1">
				<span class="text-[10px] text-white/40">{dayNames[i]}</span>
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs
						{isToday ? 'bg-blue-500 text-white' : 'text-white/60'}"
				>
					{day.getDate()}
				</span>
			</div>
		{/each}
	</div>

	<!-- Today's events -->
	<div class="flex-1 overflow-auto">
		<h3 class="mb-2 text-xs font-medium text-white/50">Heute</h3>
		{#each todayEvents as event (event.id)}
			<div class="mb-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
				<p class="text-sm font-medium text-white/80">{event.title}</p>
				<p class="text-xs text-white/40">
					{#if event.allDay}
						Ganztägig
					{:else}
						{formatTime(event.startDate)} — {formatTime(event.endDate)}
					{/if}
				</p>
				{#if event.location}
					<p class="text-xs text-white/30">{event.location}</p>
				{/if}
			</div>
		{/each}

		{#if todayEvents.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Termine heute</p>
		{/if}
	</div>
</div>
