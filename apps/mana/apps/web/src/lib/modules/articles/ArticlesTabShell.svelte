<!--
  ArticlesTabShell — Tab-Leiste + Settings + QuickAdd oben, vier Tabs
  darunter: Leseliste / Highlights / Favoriten / Stats.

  Tab-Wechsel läuft INTERN über $state (Admin-Tabbed-Card-Pattern), nicht
  über URL-Navigation. Das ist kritisch wenn die Shell als Workbench-App-
  Karte gemountet wird — goto() würde dort den User aus der Karte
  rauskicken.

  Bookmarkbarkeit kommt über die drei SvelteKit-Routen, die jeweils mit
  `initialTab` den Startpunkt setzen. Innerhalb der Shell gewechselte
  Tabs ändern die URL NICHT — das ist by design.
-->
<script lang="ts">
	import { setContext } from 'svelte';
	import { Gear } from '@mana/shared-icons';
	import { goto } from '$app/navigation';
	import ListView from './ListView.svelte';
	import HighlightsView from './views/HighlightsView.svelte';
	import StatsView from './views/StatsView.svelte';
	import QuickAddInput from './components/QuickAddInput.svelte';
	import { ARTICLES_TAB_CONTEXT, type ArticlesTabContext, type ArticlesTabId } from './tab-context';

	interface Props {
		initialTab?: ArticlesTabId;
	}
	let { initialTab = 'list' }: Props = $props();

	// svelte-ignore state_referenced_locally
	let activeTab = $state<ArticlesTabId>(initialTab);

	const TABS: { id: ArticlesTabId; label: string }[] = [
		{ id: 'list', label: 'Leseliste' },
		{ id: 'highlights', label: 'Highlights' },
		{ id: 'favorites', label: 'Favoriten' },
		{ id: 'stats', label: 'Stats' },
	];

	setContext<ArticlesTabContext>(ARTICLES_TAB_CONTEXT, {
		switchTo(tab: ArticlesTabId) {
			activeTab = tab;
		},
	});
</script>

<div class="tab-shell">
	<header class="top-bar">
		<QuickAddInput />
		<button
			type="button"
			class="icon-btn"
			title="Einstellungen — Bookmarklet + Share-Target"
			aria-label="Artikel-Einstellungen"
			onclick={() => goto('/articles/settings')}
		>
			<Gear size={18} weight="regular" />
		</button>
	</header>

	<nav class="tabs" aria-label="Artikel-Ansichten">
		{#each TABS as t (t.id)}
			<button
				type="button"
				class="tab"
				class:active={activeTab === t.id}
				aria-current={activeTab === t.id ? 'page' : undefined}
				onclick={() => (activeTab = t.id)}
			>
				{t.label}
			</button>
		{/each}
	</nav>

	<div class="tab-body">
		{#if activeTab === 'list'}
			<ListView />
		{:else if activeTab === 'highlights'}
			<HighlightsView />
		{:else if activeTab === 'favorites'}
			<ListView initialFilter="favorites" />
		{:else if activeTab === 'stats'}
			<StatsView />
		{/if}
	</div>
</div>

<style>
	.tab-shell {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		/* Innen-Padding als Single-Source-of-Truth. In Workbench-Karten */
		/* hat ModuleShell's `.shell-body` null padding — ohne das hier würde */
		/* der QuickAdd-Input direkt am Card-Rand kleben. Im Route-Kontext */
		/* liegt dieses Padding innerhalb des (app)-Layout-Wrappers und   */
		/* ergibt insgesamt ein ruhig gespaciedes Bild.                    */
		padding: 1rem 1.25rem;
	}
	.top-bar {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}
	.icon-btn {
		padding: 0.45rem 0.55rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		height: 2.35rem;
	}
	.icon-btn:hover {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.3));
	}
	.tabs {
		display: flex;
		gap: 0.15rem;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
	}
	.tab {
		padding: 0.55rem 0.9rem;
		color: var(--color-text-muted, #64748b);
		background: transparent;
		border: none;
		font: inherit;
		font-size: 0.92rem;
		font-weight: 500;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}
	.tab:hover {
		color: inherit;
	}
	.tab.active {
		color: #f97316;
		border-bottom-color: #f97316;
	}
</style>
