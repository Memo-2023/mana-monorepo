<!--
  Clock — Split-Screen AppView
  World clocks and active timers.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalWorldClock, LocalTimer, LocalAlarm } from './types';

	let worldClocks = $state<LocalWorldClock[]>([]);
	let timers = $state<LocalTimer[]>([]);
	let alarms = $state<LocalAlarm[]>([]);
	let now = $state(new Date());

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalWorldClock>('worldClocks')
				.orderBy('sortOrder')
				.toArray()
				.then((all) => all.filter((w) => !w.deletedAt));
		}).subscribe((val) => {
			worldClocks = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalTimer>('timers')
				.toArray()
				.then((all) => all.filter((t) => !t.deletedAt));
		}).subscribe((val) => {
			timers = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalAlarm>('alarms')
				.toArray()
				.then((all) => all.filter((a) => !a.deletedAt));
		}).subscribe((val) => {
			alarms = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function timeInZone(tz: string): string {
		return now.toLocaleTimeString('de', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
	}

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	const activeTimers = $derived(
		timers.filter((t) => t.status === 'running' || t.status === 'paused')
	);
	const enabledAlarms = $derived(alarms.filter((a) => a.enabled));
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<!-- Local time -->
	<div class="text-center">
		<p class="text-3xl font-light tracking-wider text-white/90">
			{now.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
		</p>
		<p class="text-xs text-white/40">
			{now.toLocaleDateString('de', { weekday: 'long', day: 'numeric', month: 'long' })}
		</p>
	</div>

	<!-- World clocks -->
	{#if worldClocks.length > 0}
		<div>
			<h3 class="mb-2 text-xs font-medium text-white/50">Weltuhr</h3>
			{#each worldClocks as wc (wc.id)}
				<div class="flex items-center justify-between py-1">
					<span class="text-sm text-white/60">{wc.cityName}</span>
					<span class="font-mono text-sm text-white/80">{timeInZone(wc.timezone)}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Active timers -->
	{#if activeTimers.length > 0}
		<div>
			<h3 class="mb-2 text-xs font-medium text-white/50">Timer</h3>
			{#each activeTimers as timer (timer.id)}
				<div class="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
					<span class="text-sm text-white/60">{timer.label ?? 'Timer'}</span>
					<span class="font-mono text-sm text-white/80">
						{formatDuration(timer.remainingSeconds ?? timer.durationSeconds)}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Alarms summary -->
	{#if enabledAlarms.length > 0}
		<div>
			<h3 class="mb-2 text-xs font-medium text-white/50">Wecker ({enabledAlarms.length})</h3>
			{#each enabledAlarms.slice(0, 3) as alarm (alarm.id)}
				<div class="flex items-center justify-between py-1">
					<span class="text-sm text-white/60">{alarm.label ?? 'Wecker'}</span>
					<span class="font-mono text-sm text-white/80">{alarm.time}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
