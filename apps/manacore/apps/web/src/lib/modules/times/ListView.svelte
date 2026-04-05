<!--
  Times — Workbench ListView
  Inline timer with start/stop + today's time entries.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { timerStore } from '$lib/modules/times/stores/timer.svelte';
	import { formatDuration } from '$lib/modules/times/queries';
	import { Play, Stop } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalTimeEntry, LocalProject } from './types';

	let { navigate, goBack, params }: ViewProps = $props();

	let entries = $state<LocalTimeEntry[]>([]);
	let projects = $state<LocalProject[]>([]);
	let description = $state('');

	const todayStr = new Date().toISOString().split('T')[0];

	// Initialize timer store to pick up running timers
	$effect(() => {
		timerStore.initialize();
	});

	// Sync description with running entry
	$effect(() => {
		if (timerStore.runningEntry) {
			description = timerStore.runningEntry.description || '';
		}
	});

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
			.filter((e) => e.date === todayStr && !e.isRunning)
			.sort((a, b) => (b.startTime ?? '').localeCompare(a.startTime ?? ''))
	);

	const totalToday = $derived(todayEntries.reduce((sum, e) => sum + e.duration, 0));

	function projectName(projectId?: string | null): string {
		if (!projectId) return 'Kein Projekt';
		return projects.find((p) => p.id === projectId)?.name ?? 'Projekt';
	}

	function fmtCompact(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	async function handleStartStop() {
		if (timerStore.isRunning) {
			await timerStore.stop();
			description = '';
		} else {
			await timerStore.start({ description });
		}
	}

	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleDescriptionInput(value: string) {
		description = value;
		if (!timerStore.isRunning) return;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			timerStore.updateRunning({ description: value });
		}, 500);
	}
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<!-- Inline Timer -->
	<div class="flex items-center gap-2">
		<button
			onclick={handleStartStop}
			class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors {timerStore.isRunning
				? 'bg-red-500/80 text-white hover:bg-red-500'
				: 'bg-white/10 text-white/50 hover:bg-green-500/80 hover:text-white'}"
		>
			{#if timerStore.isRunning}
				<Stop size={14} weight="fill" />
			{:else}
				<Play size={14} weight="fill" />
			{/if}
		</button>
		<input
			type="text"
			value={description}
			oninput={(e) => handleDescriptionInput((e.target as HTMLInputElement).value)}
			placeholder="Was trackst du?"
			class="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
		/>
		{#if timerStore.isRunning}
			<div class="flex h-7 items-center gap-1.5 rounded-full bg-green-500/10 px-2.5">
				<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></div>
				<span class="font-mono text-xs text-green-400">
					{formatDuration(timerStore.elapsedSeconds)}
				</span>
			</div>
		{/if}
	</div>

	<!-- Today stats -->
	<div class="flex items-center justify-between text-xs text-white/40">
		<span>Heute: {todayEntries.length} Eintr{todayEntries.length === 1 ? 'ag' : 'age'}</span>
		<span class="font-medium text-white/60">{fmtCompact(totalToday)}</span>
	</div>

	<!-- Entry list -->
	<div class="flex-1 overflow-auto">
		{#each todayEntries as entry (entry.id)}
			<button
				onclick={() => navigate('detail', { entryId: entry.id })}
				class="mb-1 w-full min-h-[44px] rounded-md px-3 py-2 text-left transition-colors hover:bg-white/5"
			>
				<div class="flex items-center justify-between">
					<p class="truncate text-sm text-white/80">
						{entry.description || 'Ohne Beschreibung'}
					</p>
					<span class="shrink-0 text-xs text-white/50">{fmtCompact(entry.duration)}</span>
				</div>
				<p class="text-xs text-white/30">{projectName(entry.projectId)}</p>
			</button>
		{/each}

		{#if todayEntries.length === 0 && !timerStore.isRunning}
			<p class="py-8 text-center text-sm text-white/30">Noch keine Zeiteintr&auml;ge heute</p>
		{/if}
	</div>
</div>
