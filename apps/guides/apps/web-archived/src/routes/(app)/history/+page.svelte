<script lang="ts">
	import { liveQuery } from 'dexie';
	import { runCollection, guideCollection } from '$lib/data/local-store.js';
	import type { LocalRun, LocalGuide } from '$lib/data/local-store.js';
	import { runsStore } from '$lib/stores/runs.svelte';

	let runs = $state<LocalRun[]>([]);
	let guides = $state<Map<string, LocalGuide>>(new Map());

	$effect(() => {
		const sub = liveQuery(async () => {
			const [rs, gs] = await Promise.all([runCollection.getAll(), guideCollection.getAll()]);
			return { rs, gs };
		}).subscribe(({ rs, gs }) => {
			runs = rs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
			guides = new Map(gs.map((g) => [g.id, g]));
		});
		return () => sub.unsubscribe();
	});

	let completedRuns = $derived(runs.filter((r) => r.completedAt));
	let activeRuns = $derived(runs.filter((r) => !r.completedAt));

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getDuration(run: LocalRun): string {
		if (!run.completedAt) return 'Laufend';
		const ms = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
		const min = Math.round(ms / 60000);
		return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}min`;
	}

	function getStepCount(run: LocalRun): { done: number; total: number } {
		const done = Object.values(run.stepStates).filter((s) => s.done).length;
		return { done, total: Object.keys(run.stepStates).length };
	}
</script>

<div class="p-4 md:p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Verlauf</h1>
		<p class="text-sm text-muted-foreground">{completedRuns.length} abgeschlossene Durchläufe</p>
	</div>

	<!-- Active runs -->
	{#if activeRuns.length > 0}
		<div class="mb-8">
			<h2 class="mb-3 text-sm font-semibold text-foreground">Aktive Durchläufe</h2>
			<div class="space-y-2">
				{#each activeRuns as run (run.id)}
					{@const guide = guides.get(run.guideId)}
					{@const { done, total } = getStepCount(run)}
					<a
						href="/guide/{run.guideId}/run?runId={run.id}&mode={run.mode}"
						class="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
					>
						<span class="text-2xl">{guide?.coverEmoji ?? '📖'}</span>
						<div class="flex-1 min-w-0">
							<p class="truncate font-medium text-foreground">{guide?.title ?? 'Unbekannte Anleitung'}</p>
							<p class="text-xs text-muted-foreground">
								Gestartet {formatDate(run.startedAt)} · {done} von {total} Schritten
							</p>
						</div>
						<span class="text-sm text-primary">Fortsetzen →</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Completed runs -->
	{#if completedRuns.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			<span class="mb-4 text-6xl">🕐</span>
			<h2 class="mb-2 text-lg font-semibold">Noch keine abgeschlossenen Durchläufe</h2>
			<p class="text-sm text-muted-foreground">
				Starte einen Durchlauf einer Anleitung, um hier den Verlauf zu sehen.
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each completedRuns as run (run.id)}
				{@const guide = guides.get(run.guideId)}
				{@const { done, total } = getStepCount(run)}
				<div class="flex items-center gap-3 rounded-xl bg-surface p-4">
					<span class="text-2xl">{guide?.coverEmoji ?? '📖'}</span>
					<div class="flex-1 min-w-0">
						<a
							href="/guide/{run.guideId}"
							class="block truncate font-medium text-foreground hover:text-primary"
						>
							{guide?.title ?? 'Unbekannte Anleitung'}
						</a>
						<p class="text-xs text-muted-foreground">
							{formatDate(run.startedAt)} · {getDuration(run)}
						</p>
					</div>
					<div class="text-right">
						<span class="text-sm font-medium text-green-600">✓</span>
						<p class="text-xs text-muted-foreground">{done}/{total}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
