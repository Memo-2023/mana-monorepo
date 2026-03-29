<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { games, getAllTags } from '$lib/data/games';
	import GameCard from '$lib/components/GameCard.svelte';

	let searchQuery = $state('');
	let selectedTag = $state<string | null>(null);

	const allTags = getAllTags();

	let filteredGames = $derived(() => {
		let result = games;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(g) =>
					g.title.toLowerCase().includes(q) ||
					g.description.toLowerCase().includes(q) ||
					g.tags.some((t) => t.toLowerCase().includes(q))
			);
		}

		if (selectedTag) {
			result = result.filter((g) => g.tags.includes(selectedTag!));
		}

		return result;
	});
</script>

<svelte:head>
	<title>{$_('app.name')} - {$_('home.title')}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{$_('home.title')}</h1>
		<p class="text-muted-foreground mt-1">{$_('home.subtitle')}</p>
	</div>

	<div class="flex flex-col sm:flex-row gap-3">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder={$_('home.search')}
			class="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
		/>
	</div>

	<div class="flex flex-wrap gap-2">
		<button
			class="text-xs px-3 py-1.5 rounded-full transition-colors {selectedTag === null
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			onclick={() => (selectedTag = null)}
		>
			{$_('home.allGames')}
		</button>
		{#each allTags as tag}
			<button
				class="text-xs px-3 py-1.5 rounded-full transition-colors {selectedTag === tag
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				onclick={() => (selectedTag = selectedTag === tag ? null : tag)}
			>
				{tag}
			</button>
		{/each}
	</div>

	{#if filteredGames().length === 0}
		<div class="text-center py-12">
			<p class="text-muted-foreground">{$_('home.noResults')}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each filteredGames() as game (game.id)}
				<GameCard {game} href="/play/{game.slug}" />
			{/each}
		</div>
	{/if}
</div>
