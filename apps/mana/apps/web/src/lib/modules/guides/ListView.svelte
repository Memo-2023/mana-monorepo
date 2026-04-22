<!--
  Guides — Workbench ListView
  Interactive guides list loaded from IndexedDB, with category filter,
  search, inline create, run progress indicators, and detail navigation.
-->
<script lang="ts">
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import { useAllGuides, useRunsByGuide, searchGuides, getStepProgress } from './queries';
	import { guidesStore } from './stores/guides.svelte';
	import { GUIDE_CATEGORIES, DIFFICULTY_LABELS, type GuideCategory, type Guide } from './types';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import type { LocalStep } from './types';

	let { navigate }: ViewProps = $props();

	const guidesQuery = useAllGuides();
	const runsQuery = useRunsByGuide();

	// Step counts per guide for progress display
	const stepCountsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalStep>('steps').toArray();
		const counts = new Map<string, number>();
		for (const s of all) {
			if (s.deletedAt) continue;
			counts.set(s.guideId, (counts.get(s.guideId) ?? 0) + 1);
		}
		return counts;
	}, new Map<string, number>());

	const guides = $derived(guidesQuery.value);
	const runs = $derived(runsQuery.value);
	const stepCounts = $derived(stepCountsQuery.value);

	let query = $state('');
	let activeCategory = $state<GuideCategory | 'all'>('all');

	const categories: Array<{ id: GuideCategory | 'all'; label: string }> = [
		{ id: 'all', label: 'Alle' },
		...(Object.entries(GUIDE_CATEGORIES) as Array<[GuideCategory, { label: string }]>).map(
			([id, { label }]) => ({ id, label })
		),
	];

	const filtered = $derived(() => {
		let result = searchGuides(guides, query);
		if (activeCategory !== 'all') {
			result = result.filter((g) => g.category === activeCategory);
		}
		return result;
	});

	// ── Inline create ──────────────────────────────────────
	let creating = $state(false);
	let newTitle = $state('');
	let newCategory = $state<GuideCategory>('getting-started');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const title = newTitle.trim();
		if (!title) return;
		const guide = await guidesStore.createGuide({ title, category: newCategory });
		newTitle = '';
		creating = false;
		navigate('detail', {
			guideId: guide.id,
			_siblingIds: [...guides.map((g) => g.id), guide.id],
			_siblingKey: 'guideId',
		});
	}

	function openGuide(guide: Guide) {
		navigate('detail', {
			guideId: guide.id,
			_siblingIds: filtered().map((g) => g.id),
			_siblingKey: 'guideId',
		});
	}
</script>

<BaseListView items={filtered()} getKey={(g) => g.id} emptyTitle="Keine Guides gefunden">
	{#snippet toolbar()}
		<!-- Search -->
		<input
			bind:value={query}
			placeholder="Guides durchsuchen..."
			class="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
		/>

		<!-- Category filter + create toggle -->
		<div class="flex items-center justify-between gap-2">
			<div class="flex flex-wrap gap-1">
				{#each categories as cat (cat.id)}
					<button
						type="button"
						onclick={() => (activeCategory = cat.id)}
						class="rounded-full px-3 py-1 text-xs transition-colors
							{activeCategory === cat.id
							? 'bg-primary/20 text-primary'
							: 'bg-muted/30 text-muted-foreground hover:bg-muted'}"
					>
						{cat.label}
					</button>
				{/each}
			</div>
			<button
				type="button"
				class="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neuer Guide'}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-muted/30 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Guide-Titel"
					required
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<select
					bind:value={newCategory}
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
				>
					{#each Object.entries(GUIDE_CATEGORIES) as [key, info] (key)}
						<option value={key}>{info.label}</option>
					{/each}
				</select>
				<button
					type="submit"
					class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newTitle.trim()}
				>
					Guide erstellen
				</button>
			</form>
		{/if}
	{/snippet}

	{#snippet header()}
		<span>{guides.length} Guides</span>
	{/snippet}

	{#snippet item(guide)}
		{@const meta = GUIDE_CATEGORIES[guide.category]}
		{@const run = runs.get(guide.id)}
		{@const totalSteps = stepCounts.get(guide.id) ?? 0}
		{@const progress = getStepProgress(run ?? null, totalSteps)}
		<button
			onclick={() => openGuide(guide)}
			class="mb-2 w-full rounded-md border border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted"
		>
			<div class="mb-1 flex items-center gap-2">
				<span class="inline-block h-2 w-2 rounded-full {meta.color}"></span>
				<span class="text-xs text-muted-foreground">{meta.label}</span>
				<span class="ml-auto text-xs text-muted-foreground/70">{guide.estimatedMinutes} min</span>
			</div>
			<h3 class="text-sm font-medium text-foreground">{guide.title}</h3>
			<p class="mt-0.5 text-xs text-muted-foreground">{guide.description}</p>
			<div class="mt-1.5 flex items-center gap-2">
				<span class="text-[10px] uppercase tracking-wide text-muted-foreground/70">
					{DIFFICULTY_LABELS[guide.difficulty]}
				</span>
				{#if run}
					{#if run.completedAt}
						<span class="ml-auto text-[10px] font-medium text-success">Abgeschlossen</span>
					{:else if totalSteps > 0}
						<div class="ml-auto flex items-center gap-1.5">
							<div class="h-1 w-12 rounded-full bg-muted">
								<div class="h-full rounded-full bg-primary" style="width: {progress}%"></div>
							</div>
							<span class="text-[10px] text-muted-foreground/70">{progress}%</span>
						</div>
					{/if}
				{/if}
			</div>
		</button>
	{/snippet}
</BaseListView>
