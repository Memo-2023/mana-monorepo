<script lang="ts">
	/**
	 * ActiveTimerWidget — Zeigt laufende Timer aus Times.
	 *
	 * Liest direkt aus der unified IndexedDB (timeEntries + timeProjects tables).
	 * Aktualisiert die verstrichene Zeit per requestAnimationFrame.
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { onDestroy } from 'svelte';
	import type { BaseRecord } from '@mana/local-store';

	interface TimeEntry extends BaseRecord {
		projectId?: string | null;
		description: string;
		date: string;
		startTime?: string | null;
		endTime?: string | null;
		duration: number;
		isRunning: boolean;
	}

	interface TimeProject extends BaseRecord {
		name: string;
		color: string;
	}

	let runningEntry: (TimeEntry & { projectName?: string; projectColor?: string }) | null =
		$state(null);
	let loading = $state(true);
	let elapsed = $state('00:00:00');
	let animFrameId: number | null = null;

	$effect(() => {
		const sub = liveQuery(async () => {
			const entries = await db.table<TimeEntry>('timeEntries').toArray();
			const running = entries.find((e) => e.isRunning && !e.deletedAt);
			if (!running) return null;

			let projectName: string | undefined;
			let projectColor: string | undefined;
			if (running.projectId) {
				const proj = await db.table<TimeProject>('timeProjects').get(running.projectId);
				if (proj) {
					projectName = proj.name;
					projectColor = proj.color;
				}
			}

			return { ...running, projectName, projectColor };
		}).subscribe({
			next: (val) => {
				runningEntry = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	// Tick the elapsed timer
	$effect(() => {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}

		if (!runningEntry?.startTime) {
			elapsed = '00:00:00';
			return;
		}

		const entryDate = runningEntry.date;
		const startTimeStr = runningEntry.startTime;

		function tick() {
			const startDateTime = new Date(`${entryDate}T${startTimeStr}`);
			const now = new Date();
			const diffSec = Math.max(0, Math.floor((now.getTime() - startDateTime.getTime()) / 1000));

			const h = Math.floor(diffSec / 3600);
			const m = Math.floor((diffSec % 3600) / 60);
			const s = diffSec % 60;
			elapsed = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

			animFrameId = requestAnimationFrame(tick);
		}

		tick();
	});

	onDestroy(() => {
		if (animFrameId !== null) cancelAnimationFrame(animFrameId);
	});
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Zeiterfassung</h3>
	</div>

	{#if loading}
		<div class="h-16 animate-pulse rounded bg-surface-hover"></div>
	{:else if !runningEntry}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#9201;</div>
			<p class="text-sm text-muted-foreground">Kein Timer aktiv.</p>
			<a
				href="/times"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Timer starten
			</a>
		</div>
	{:else}
		<a href="/times" class="block rounded-lg p-3 transition-colors hover:bg-surface-hover">
			<div class="flex items-center gap-3">
				{#if runningEntry.projectColor}
					<div
						class="h-3 w-3 flex-shrink-0 rounded-full"
						style="background-color: {runningEntry.projectColor}"
					></div>
				{/if}
				<div class="min-w-0 flex-1">
					{#if runningEntry.projectName}
						<p class="text-xs font-medium text-muted-foreground">
							{runningEntry.projectName}
						</p>
					{/if}
					<p class="truncate text-sm font-medium">
						{runningEntry.description || 'Ohne Beschreibung'}
					</p>
				</div>
			</div>

			<div class="mt-3 flex items-center justify-center">
				<div class="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
					<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
					<span class="font-mono text-lg font-bold text-primary">{elapsed}</span>
				</div>
			</div>
		</a>
	{/if}
</div>
