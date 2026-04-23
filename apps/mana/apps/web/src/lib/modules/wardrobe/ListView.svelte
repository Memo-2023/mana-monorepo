<!--
  Wardrobe module root — two tabs: Kleidung (GridView, default) and
  Outfits (OutfitsView). Keep the tab state local; SvelteKit keeps
  ListView mounted across navigations within /wardrobe/, so scrolling
  back to "/wardrobe" preserves which tab the user last opened.

  No mx-auto / max-w wrapper here: the workbench AppPage renders us
  inside a width-sized ModuleShell (~480px by default), and the /wardrobe
  RoutePage is wrapped by (app)/+layout.svelte's `mx-auto max-w-7xl`.
  Adding our own cap stacks paddings and looks wrong in both places.
  container-type: inline-size lets inner views react to the card width
  the same way picture/ListView does.
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

<div class="wardrobe-root">
	<nav class="wardrobe-tabs" aria-label="Ansicht wechseln">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				class="wardrobe-tab"
				class:active={activeTab === tab.key}
				aria-pressed={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<div class="wardrobe-body">
		{#if activeTab === 'garments'}
			<GridView />
		{:else}
			<OutfitsView />
		{/if}
	</div>
</div>

<style>
	.wardrobe-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		container-type: inline-size;
	}
	.wardrobe-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}
	.wardrobe-tab {
		position: relative;
		padding: 0.5rem 0.75rem;
		margin-bottom: -1px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.wardrobe-tab:hover {
		color: hsl(var(--color-foreground));
	}
	.wardrobe-tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}
	.wardrobe-body {
		flex: 1;
		min-height: 0;
	}
	@container (min-width: 640px) {
		.wardrobe-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
