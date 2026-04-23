<!--
  Wardrobe module root — two tabs: Kleidung (GridView, default) and
  Outfits (OutfitsView). Keep the tab state local; SvelteKit keeps
  ListView mounted across navigations within /wardrobe/, so scrolling
  back to "/wardrobe" preserves which tab the user last opened.
-->
<script lang="ts">
	import GridView from './views/GridView.svelte';
	import OutfitsView from './views/OutfitsView.svelte';

	type Tab = 'garments' | 'outfits';

	let activeTab = $state<Tab>('garments');

	const TABS: { key: Tab; label: string }[] = [
		{ key: 'garments', label: 'Kleidung' },
		{ key: 'outfits', label: 'Outfits' },
	];
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6">
	<nav class="mb-6 flex gap-1 border-b border-border">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				onclick={() => (activeTab = tab.key)}
				class="relative px-3 py-2 text-sm font-medium transition-colors {activeTab === tab.key
					? 'text-primary'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				{tab.label}
				{#if activeTab === tab.key}
					<span class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" aria-hidden="true"
					></span>
				{/if}
			</button>
		{/each}
	</nav>

	{#if activeTab === 'garments'}
		<GridView />
	{:else}
		<OutfitsView />
	{/if}
</div>
