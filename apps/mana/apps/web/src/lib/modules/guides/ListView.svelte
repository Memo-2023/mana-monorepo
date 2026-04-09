<!--
  Guides — Workbench ListView
  Static, curated list of interactive guides grouped by category.
-->
<script lang="ts">
	import { GUIDES, GUIDE_CATEGORIES, type GuideCategory } from './index';

	let query = $state('');
	let activeCategory = $state<GuideCategory | 'all'>('all');

	const categories: Array<{ id: GuideCategory | 'all'; label: string }> = [
		{ id: 'all', label: 'Alle' },
		...(Object.entries(GUIDE_CATEGORIES) as Array<[GuideCategory, { label: string }]>).map(
			([id, { label }]) => ({ id, label })
		),
	];

	const filtered = $derived(
		GUIDES.filter((g) => {
			if (activeCategory !== 'all' && g.category !== activeCategory) return false;
			if (!query.trim()) return true;
			const q = query.toLowerCase();
			return g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
		})
	);

	const difficultyLabel: Record<string, string> = {
		beginner: 'Einsteiger',
		intermediate: 'Fortgeschritten',
		advanced: 'Profi',
	};
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<input
		bind:value={query}
		placeholder="Guides durchsuchen..."
		class="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
	/>

	<div class="flex flex-wrap gap-1">
		{#each categories as cat (cat.id)}
			<button
				onclick={() => (activeCategory = cat.id)}
				class="rounded-full px-3 py-1 text-xs transition-colors
					{activeCategory === cat.id
					? 'bg-white/15 text-white'
					: 'bg-white/5 text-white/50 hover:bg-white/10'}"
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<div class="flex-1 space-y-2 overflow-auto">
		{#each filtered as guide (guide.id)}
			{@const meta = GUIDE_CATEGORIES[guide.category]}
			<div
				class="rounded-md border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
			>
				<div class="mb-1 flex items-center gap-2">
					<span class="h-2 w-2 rounded-full {meta.color}"></span>
					<span class="text-xs text-white/40">{meta.label}</span>
					<span class="ml-auto text-xs text-white/30">{guide.estimatedMinutes} min</span>
				</div>
				<h3 class="text-sm font-medium text-white/90">{guide.title}</h3>
				<p class="mt-0.5 text-xs text-white/50">{guide.description}</p>
				<p class="mt-1 text-[10px] uppercase tracking-wide text-white/30">
					{difficultyLabel[guide.difficulty]}
				</p>
			</div>
		{:else}
			<p class="py-8 text-center text-xs text-white/40">Keine Guides gefunden.</p>
		{/each}
	</div>
</div>
