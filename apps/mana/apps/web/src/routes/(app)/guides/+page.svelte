<script lang="ts">
	import { GUIDES, GUIDE_CATEGORIES, type GuideCategory } from '$lib/modules/guides';
	import { BookOpen, Clock, ArrowRight } from '@mana/shared-icons';

	let selectedCategory: GuideCategory | 'all' = $state('all');

	const filteredGuides = $derived(
		selectedCategory === 'all' ? GUIDES : GUIDES.filter((g) => g.category === selectedCategory)
	);

	const categories = Object.entries(GUIDE_CATEGORIES) as [
		GuideCategory,
		{ label: string; color: string },
	][];

	function difficultyLabel(d: string) {
		switch (d) {
			case 'beginner':
				return 'Einsteiger';
			case 'intermediate':
				return 'Mittel';
			case 'advanced':
				return 'Fortgeschritten';
			default:
				return d;
		}
	}
</script>

<svelte:head>
	<title>Guides - Mana</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">Guides</h1>
		<p class="text-muted-foreground mt-1 text-sm">Tutorials & Anleitungen für das Mana-Ökosystem</p>
	</header>

	<!-- Category Filter -->
	<div class="mb-6 flex flex-wrap gap-2">
		<button
			onclick={() => (selectedCategory = 'all')}
			class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {selectedCategory ===
			'all'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
		>
			Alle
		</button>
		{#each categories as [key, cat]}
			<button
				onclick={() => (selectedCategory = key)}
				class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {selectedCategory ===
				key
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<!-- Guide Cards -->
	{#if filteredGuides.length === 0}
		<div class="flex flex-col items-center py-16 text-center">
			<BookOpen size={40} class="mb-4 text-muted-foreground" />
			<p class="text-muted-foreground">Keine Guides in dieser Kategorie.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredGuides as guide}
				{@const cat = GUIDE_CATEGORIES[guide.category]}
				<div
					class="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md"
				>
					<div
						class="{cat.color} flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
					>
						<BookOpen size={20} />
					</div>

					<div class="min-w-0 flex-1">
						<h3 class="font-medium text-foreground">{guide.title}</h3>
						<p class="text-sm text-muted-foreground">{guide.description}</p>
						<div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<Clock size={12} />
								{guide.estimatedMinutes} Min.
							</span>
							<span class="rounded-full bg-muted px-2 py-0.5">
								{difficultyLabel(guide.difficulty)}
							</span>
						</div>
					</div>

					<ArrowRight
						size={20}
						class="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
					/>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Coming Soon Note -->
	<div class="mt-8 rounded-xl border border-dashed border-border p-6 text-center">
		<p class="text-sm text-muted-foreground">
			Weitere Guides werden laufend hinzugefügt. Die Inhalte sind aktuell noch Platzhalter.
		</p>
	</div>
</div>
