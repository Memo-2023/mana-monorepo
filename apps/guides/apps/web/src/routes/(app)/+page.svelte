<script lang="ts">
	import { liveQuery } from 'dexie';
	import { getContext } from 'svelte';
	import { guideCollection, runCollection, type LocalGuide } from '$lib/data/local-store.js';
	import GuideCard from '$lib/components/GuideCard.svelte';

	// Filter state
	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let selectedDifficulty = $state<string | null>(null);

	// Live data
	let allGuides = $state<LocalGuide[]>([]);
	let runCountByGuide = $state<Record<string, number>>({});
	let activeRunByGuide = $state<Record<string, boolean>>({});

	$effect(() => {
		const sub = liveQuery(() => guideCollection.getAll()).subscribe((guides) => {
			allGuides = guides;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(() => runCollection.getAll()).subscribe((runs) => {
			const counts: Record<string, number> = {};
			const active: Record<string, boolean> = {};
			for (const run of runs) {
				if (run.completedAt) counts[run.guideId] = (counts[run.guideId] ?? 0) + 1;
				else active[run.guideId] = true;
			}
			runCountByGuide = counts;
			activeRunByGuide = active;
		});
		return () => sub.unsubscribe();
	});

	// Derived filtered guides
	let categories = $derived([...new Set(allGuides.map((g) => g.category))].sort());

	let filteredGuides = $derived(
		allGuides.filter((g) => {
			if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			if (selectedCategory && g.category !== selectedCategory) return false;
			if (selectedDifficulty && g.difficulty !== selectedDifficulty) return false;
			return true;
		})
	);

	const openCreateGuide = getContext<() => void>('openCreateGuide');

	const difficultyLabels = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
</script>

<div class="p-4 md:p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Bibliothek</h1>
			<p class="text-sm text-muted-foreground">{allGuides.length} Anleitungen</p>
		</div>
		<button
			onclick={openCreateGuide}
			class="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover md:flex items-center gap-2"
		>
			+ Neue Anleitung
		</button>
	</div>

	<!-- Search & Filters -->
	<div class="mb-6 flex flex-wrap gap-3">
		<input
			type="search"
			placeholder="Suchen..."
			bind:value={searchQuery}
			class="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[180px]"
		/>

		<div class="flex gap-2 flex-wrap">
			<!-- Category filter -->
			{#each categories as cat}
				<button
					onclick={() => (selectedCategory = selectedCategory === cat ? null : cat)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors
					{selectedCategory === cat
						? 'bg-primary text-white'
						: 'bg-muted text-muted-foreground hover:bg-accent'}"
				>
					{cat}
				</button>
			{/each}

			<!-- Difficulty filter -->
			{#each Object.entries(difficultyLabels) as [val, label]}
				<button
					onclick={() => (selectedDifficulty = selectedDifficulty === val ? null : val)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors
					{selectedDifficulty === val
						? 'bg-primary text-white'
						: 'bg-muted text-muted-foreground hover:bg-accent'}"
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Guide grid -->
	{#if filteredGuides.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			{#if allGuides.length === 0}
				<span class="mb-4 text-6xl">📖</span>
				<h2 class="mb-2 text-lg font-semibold text-foreground">Noch keine Anleitungen</h2>
				<p class="mb-6 text-sm text-muted-foreground">
					Erstelle deine erste Anleitung — ein Rezept, eine SOP, ein Lernpfad.
				</p>
				<button
					onclick={openCreateGuide}
					class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
				>
					Erste Anleitung erstellen
				</button>
			{:else}
				<span class="mb-3 text-4xl">🔍</span>
				<p class="text-sm text-muted-foreground">Keine Ergebnisse für diese Filter.</p>
				<button
					onclick={() => {
						searchQuery = '';
						selectedCategory = null;
						selectedDifficulty = null;
					}}
					class="mt-3 text-sm text-primary hover:underline"
				>
					Filter zurücksetzen
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredGuides as guide (guide.id)}
				<GuideCard
					{guide}
					runCount={runCountByGuide[guide.id] ?? 0}
					hasActiveRun={activeRunByGuide[guide.id] ?? false}
				/>
			{/each}
		</div>
	{/if}
</div>
