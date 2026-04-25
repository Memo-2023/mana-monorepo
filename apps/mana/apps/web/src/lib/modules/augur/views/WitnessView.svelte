<!--
  Augur — Witness View

  Default surface for the module. A vibe-colored gallery of signs with kind
  tabs, search, and a collapsible capture form. Click a card → detail route.

  Strings live in `T` (interpolation pattern) so they don't bump the
  i18n-hardcoded baseline. Real $_('augur.*') keys land later.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import KindTabs from '../components/KindTabs.svelte';
	import EntryCard from '../components/EntryCard.svelte';
	import EntryForm from '../components/EntryForm.svelte';
	import DueBanner from '../components/DueBanner.svelte';
	import {
		useAllAugurEntries,
		useUnresolvedAugurEntries,
		useDueForReveal,
		searchAugurEntries,
	} from '../queries';
	import { isDue } from '../lib/reminders';
	import type { AugurEntry, AugurKind } from '../types';

	let entries$ = useAllAugurEntries();
	let entries = $derived(entries$.value);

	let unresolved$ = useUnresolvedAugurEntries();
	let unresolvedCount = $derived(unresolved$.value.length);

	let due$ = useDueForReveal();
	let dueEntries = $derived(due$.value);

	let activeKind = $state<AugurKind | 'all'>('all');
	let searchQuery = $state('');
	let showOpenOnly = $state(false);
	let showDueOnly = $state(false);
	let showCreate = $state(false);

	const counts = $derived<Record<AugurKind, number>>({
		omen: entries.filter((e) => e.kind === 'omen').length,
		fortune: entries.filter((e) => e.kind === 'fortune').length,
		hunch: entries.filter((e) => e.kind === 'hunch').length,
	});

	const filtered = $derived.by(() => {
		let list = entries;
		if (activeKind !== 'all') list = list.filter((e) => e.kind === activeKind);
		if (showOpenOnly) list = list.filter((e) => e.outcome === 'open');
		if (showDueOnly) list = list.filter((e) => isDue(e));
		if (searchQuery.trim()) list = searchAugurEntries(list, searchQuery.trim());
		return list;
	});

	function openEntry(e: AugurEntry) {
		goto(`/augur/entry/${e.id}`);
	}
</script>

<div class="shell">
	<div class="controls">
		<div class="search-row">
			<input
				type="search"
				class="search"
				bind:value={searchQuery}
				placeholder={$_('augur.witness.searchPlaceholder')}
			/>
			<button
				type="button"
				class="create-btn"
				class:active={showCreate}
				onclick={() => (showCreate = !showCreate)}
				aria-expanded={showCreate}
			>
				{showCreate ? $_('augur.witness.newClose') : $_('augur.witness.newOpen')}
			</button>
		</div>

		{#if showCreate}
			<EntryForm mode="create" onclose={() => (showCreate = false)} />
		{/if}

		<DueBanner entries={dueEntries} />

		<KindTabs active={activeKind} {counts} onselect={(k) => (activeKind = k)} />

		<div class="filter-row">
			<label class="open-toggle">
				<input type="checkbox" bind:checked={showOpenOnly} />
				<span>{$_('augur.witness.openOnly')}</span>
				{#if unresolvedCount > 0}
					<span class="badge open">{unresolvedCount} {$_('augur.witness.openHint')}</span>
				{/if}
			</label>
			<label class="open-toggle">
				<input type="checkbox" bind:checked={showDueOnly} />
				<span>{$_('augur.witness.dueOnly')}</span>
				{#if dueEntries.length > 0}
					<span class="badge due">{dueEntries.length}</span>
				{/if}
			</label>
		</div>
	</div>

	{#if filtered.length === 0}
		<p class="empty">
			{entries.length === 0 ? $_('augur.witness.emptyAll') : $_('augur.witness.emptyFiltered')}
		</p>
	{:else}
		<ul class="grid">
			{#each filtered as entry (entry.id)}
				<li>
					<EntryCard {entry} onclick={openEntry} />
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		max-width: 80rem;
		margin: 0 auto;
		width: 100%;
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.search-row {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}
	.search {
		flex: 1;
		font: inherit;
		font-size: 0.92rem;
		padding: 0.55rem 0.85rem;
		border-radius: 0.6rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--color-surface-input, rgba(255, 255, 255, 0.04));
		color: var(--color-text, inherit);
	}
	.create-btn {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.55rem 1rem;
		border-radius: 0.6rem;
		border: 1px solid #7c3aed;
		background: color-mix(in srgb, #7c3aed 18%, transparent);
		color: #ddd6fe;
		cursor: pointer;
		white-space: nowrap;
	}
	.create-btn.active {
		background: color-mix(in srgb, #7c3aed 28%, transparent);
	}
	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		font-size: 0.85rem;
	}
	.open-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.65));
	}
	.badge {
		font-size: 0.72rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
	}
	.badge.open {
		background: color-mix(in srgb, #38bdf8 18%, transparent);
		color: #7dd3fc;
	}
	.badge.due {
		background: color-mix(in srgb, #f59e0b 18%, transparent);
		color: #fcd34d;
	}
	.empty {
		text-align: center;
		padding: 3rem 1rem;
		font-size: 0.95rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border-radius: 0.75rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
		gap: 0.85rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}
	.grid > li {
		list-style: none;
	}
</style>
