<script lang="ts">
	import { page } from '$app/stores';
	import { liveQuery } from 'dexie';
	import { goto } from '$app/navigation';
	import {
		collectionCollection,
		guideCollection,
		runCollection,
		type LocalCollection,
		type LocalGuide,
		type LocalRun,
	} from '$lib/data/local-store.js';
	import { runsStore } from '$lib/stores/runs.svelte';

	let colId = $derived($page.params.id);
	let collection = $state<LocalCollection | null>(null);
	let guides = $state<LocalGuide[]>([]);
	let runs = $state<LocalRun[]>([]);

	$effect(() => {
		const id = colId;
		const sub = liveQuery(async () => {
			const [col, allGuides, allRuns] = await Promise.all([
				collectionCollection.get(id),
				guideCollection.getAll(),
				runCollection.getAll(),
			]);
			return { col, allGuides, allRuns };
		}).subscribe(({ col, allGuides, allRuns }) => {
			collection = col ?? null;
			if (!col) return;
			if (col.type === 'path') {
				guides = col.guideOrder
					.map((gid) => allGuides.find((g) => g.id === gid))
					.filter(Boolean) as LocalGuide[];
			} else {
				guides = allGuides.filter((g) => g.collectionId === col.id);
			}
			runs = allRuns;
		});
		return () => sub.unsubscribe();
	});

	function isGuideCompleted(guideId: string) {
		return runs.some((r) => r.guideId === guideId && r.completedAt);
	}

	function getLastRunDate(guideId: string): string | null {
		const guideRuns = runs.filter((r) => r.guideId === guideId && r.completedAt);
		if (!guideRuns.length) return null;
		const latest = guideRuns.sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
		return new Date(latest.completedAt!).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	let completedCount = $derived(guides.filter((g) => isGuideCompleted(g.id)).length);
	let progress = $derived(guides.length > 0 ? Math.round((completedCount / guides.length) * 100) : 0);

	const difficultyConfig = {
		easy: { label: 'Einfach', color: 'text-green-600' },
		medium: { label: 'Mittel', color: 'text-amber-600' },
		hard: { label: 'Schwer', color: 'text-red-600' },
	};

	async function startGuide(guide: LocalGuide) {
		// Find or create active run
		const activeRun = await runsStore.getActiveRun(guide.id);
		if (activeRun) {
			goto(`/guide/${guide.id}/run?runId=${activeRun.id}&mode=${activeRun.mode}`);
		} else {
			const run = await runsStore.startRun(guide.id, 'scroll');
			if (run) goto(`/guide/${guide.id}/run?runId=${run.id}&mode=scroll`);
		}
	}
</script>

{#if !collection}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Sammlung nicht gefunden.</p>
	</div>
{:else}
	<div class="mx-auto max-w-2xl p-4 md:p-8">
		<a href="/collections" class="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
			← Sammlungen
		</a>

		<!-- Header -->
		<div class="mb-8 rounded-2xl p-6" style="background-color: {collection.coverColor ?? '#0d9488'}18">
			<div class="flex items-start gap-4">
				<span class="text-5xl">{collection.coverEmoji ?? (collection.type === 'path' ? '🗺' : '📚')}</span>
				<div class="flex-1">
					<div class="mb-1 flex items-center gap-2">
						<h1 class="text-2xl font-bold text-foreground">{collection.title}</h1>
						<span class="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
							{collection.type === 'path' ? 'Lernpfad' : 'Bibliothek'}
						</span>
					</div>
					{#if collection.description}
						<p class="mb-3 text-sm text-muted-foreground">{collection.description}</p>
					{/if}
					<div class="text-sm text-muted-foreground">{guides.length} Anleitungen</div>
				</div>
			</div>

			{#if collection.type === 'path'}
				<div class="mt-5">
					<div class="mb-1.5 flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{completedCount} von {guides.length} abgeschlossen</span>
						<span class="font-semibold text-primary">{progress}%</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-surface">
						<div class="h-full rounded-full bg-primary transition-all" style="width: {progress}%"></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Guide list -->
		<div class="space-y-3">
			{#each guides as guide, i (guide.id)}
				{@const completed = isGuideCompleted(guide.id)}
				{@const lastRun = getLastRunDate(guide.id)}
				<div
					class="flex items-center gap-4 rounded-xl border p-4 transition-all
					{completed ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20' : 'border-border bg-surface'}"
				>
					<!-- Index / Check -->
					{#if collection.type === 'path'}
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold
							{completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}"
						>
							{completed ? '✓' : i + 1}
						</div>
					{:else}
						<span class="text-2xl">{guide.coverEmoji ?? '📖'}</span>
					{/if}

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<a href="/guide/{guide.id}" class="block truncate font-medium text-foreground hover:text-primary">
							{guide.title}
						</a>
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							<span class="{difficultyConfig[guide.difficulty].color}">{difficultyConfig[guide.difficulty].label}</span>
							{#if guide.estimatedMinutes}
								<span>· {guide.estimatedMinutes}min</span>
							{/if}
							{#if lastRun}
								<span>· ✓ {lastRun}</span>
							{/if}
						</div>
					</div>

					<!-- Action -->
					<button
						onclick={() => startGuide(guide)}
						class="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
						{completed
							? 'border border-border text-muted-foreground hover:bg-accent'
							: 'bg-primary text-white hover:bg-primary-hover'}"
					>
						{completed ? 'Wiederholen' : 'Starten'}
					</button>
				</div>
			{/each}
		</div>

		{#if guides.length === 0}
			<div class="py-16 text-center">
				<p class="text-muted-foreground">Diese Sammlung enthält noch keine Anleitungen.</p>
			</div>
		{/if}
	</div>
{/if}
