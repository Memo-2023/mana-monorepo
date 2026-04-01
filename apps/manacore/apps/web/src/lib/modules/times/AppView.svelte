<!--
  Times — Split-Screen AppView
  Today's time entries with running timer and daily total.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalTimeEntry, LocalProject } from './types';

	let entries = $state<LocalTimeEntry[]>([]);
	let projects = $state<LocalProject[]>([]);

	const todayStr = new Date().toISOString().split('T')[0];

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalTimeEntry>('timeEntries')
				.toArray()
				.then((all) => all.filter((e) => !e.deletedAt));
		}).subscribe((val) => {
			entries = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalProject>('timesProjects')
				.toArray()
				.then((all) => all.filter((p) => !p.deletedAt));
		}).subscribe((val) => {
			projects = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const todayEntries = $derived(
		entries
			.filter((e) => e.date === todayStr)
			.sort((a, b) => (b.startTime ?? '').localeCompare(a.startTime ?? ''))
	);

	const running = $derived(entries.find((e) => e.isRunning));

	const totalToday = $derived(todayEntries.reduce((sum, e) => sum + e.duration, 0));

	function projectName(projectId?: string | null): string {
		if (!projectId) return 'Kein Projekt';
		return projects.find((p) => p.id === projectId)?.name ?? 'Projekt';
	}

	function formatDuration(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<!-- Running timer -->
	{#if running}
		<div class="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
				<p class="text-sm font-medium text-white/80">{running.description || 'Timer läuft'}</p>
			</div>
			<p class="mt-0.5 text-xs text-white/40">{projectName(running.projectId)}</p>
		</div>
	{/if}

	<!-- Today stats -->
	<div class="flex items-center justify-between text-xs text-white/40">
		<span>Heute: {todayEntries.length} Einträge</span>
		<span class="font-medium text-white/60">{formatDuration(totalToday)}</span>
	</div>

	<!-- Entry list -->
	<div class="flex-1 overflow-auto">
		{#each todayEntries as entry (entry.id)}
			<div class="mb-1 rounded-md px-3 py-2 transition-colors hover:bg-white/5">
				<div class="flex items-center justify-between">
					<p class="truncate text-sm text-white/80">{entry.description || 'Ohne Beschreibung'}</p>
					<span class="shrink-0 text-xs text-white/50">{formatDuration(entry.duration)}</span>
				</div>
				<p class="text-xs text-white/30">{projectName(entry.projectId)}</p>
			</div>
		{/each}

		{#if todayEntries.length === 0 && !running}
			<p class="py-8 text-center text-sm text-white/30">Noch keine Zeiteinträge heute</p>
		{/if}
	</div>
</div>
