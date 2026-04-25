<!--
  Comic module root — Tab-Switcher zwischen Stories und Characters.
  Stories sind das primäre Output-Artefakt, Characters die
  wiederverwendbaren Identity-Anchors. Tab-State ist lokal und
  bleibt erhalten solange ListView gemountet ist (SvelteKit hält
  uns gemountet bei Navigation innerhalb /comic).
-->
<script lang="ts">
	import StoriesView from './views/ListView.svelte';
	import CharactersView from './views/CharactersView.svelte';
	import { useAllCharacters } from './queries';

	type Tab = 'stories' | 'characters';

	let activeTab = $state<Tab>('stories');

	const characters$ = useAllCharacters();
	const characterCount = $derived(characters$.value?.length ?? 0);

	const TABS: { key: Tab; label: string; count?: number }[] = $derived([
		{ key: 'stories', label: 'Stories' },
		{ key: 'characters', label: 'Characters', count: characterCount },
	]);
</script>

<div class="comic-root">
	<nav class="comic-tabs" aria-label="Ansicht wechseln">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				class="comic-tab"
				class:active={activeTab === tab.key}
				aria-pressed={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
				{#if tab.count !== undefined && tab.count > 0}
					<span class="comic-tab-count">{tab.count}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<div class="comic-body">
		{#if activeTab === 'stories'}
			<StoriesView />
		{:else}
			<CharactersView />
		{/if}
	</div>
</div>

<style>
	.comic-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		container-type: inline-size;
	}
	.comic-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}
	.comic-tab {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
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
	.comic-tab:hover {
		color: hsl(var(--color-foreground));
	}
	.comic-tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}
	.comic-tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
	}
	.comic-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
	@container (min-width: 640px) {
		.comic-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
