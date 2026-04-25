<!--
  Library — ListView
  Tabbed grid: KindTabs + StatusFilter + search + favourites toggle.
  Click an entry → navigate to detail route.
  "+ Neu" opens EntryForm in an overlay.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import KindTabs from './components/KindTabs.svelte';
	import StatusFilter from './components/StatusFilter.svelte';
	import EntryForm from './components/EntryForm.svelte';
	import GridView from './views/GridView.svelte';
	import { useAllEntries, searchEntries, filterByKind, filterByStatus } from './queries';
	import type { LibraryEntry, LibraryKind, LibraryStatus } from './types';

	const entries$ = useAllEntries();
	const entries = $derived(entries$.value);

	let activeKind = $state<LibraryKind | 'all'>('all');
	let activeStatus = $state<LibraryStatus | null>(null);
	let searchQuery = $state('');
	let showFavoritesOnly = $state(false);
	let showCreate = $state(false);

	const counts = $derived<Record<LibraryKind, number>>({
		book: entries.filter((e) => e.kind === 'book').length,
		movie: entries.filter((e) => e.kind === 'movie').length,
		series: entries.filter((e) => e.kind === 'series').length,
		comic: entries.filter((e) => e.kind === 'comic').length,
	});

	const filtered = $derived.by(() => {
		let result = entries;
		if (activeKind !== 'all') result = filterByKind(result, activeKind);
		if (activeStatus) result = filterByStatus(result, activeStatus);
		if (showFavoritesOnly) result = result.filter((e) => e.isFavorite);
		if (searchQuery.trim()) result = searchEntries(result, searchQuery.trim());
		return result;
	});

	function openEntry(e: LibraryEntry) {
		goto(`/library/entry/${e.id}`);
	}

	function presetKind(): LibraryKind | undefined {
		return activeKind === 'all' ? undefined : activeKind;
	}
</script>

<div class="library-shell">
	<div class="controls">
		<div class="search-row">
			<input
				type="search"
				class="search"
				bind:value={searchQuery}
				placeholder="Suche nach Titel oder Creator…"
			/>
			<button
				type="button"
				class="create-btn"
				class:active={showCreate}
				onclick={() => (showCreate = !showCreate)}
				aria-expanded={showCreate}
			>
				{showCreate ? '× Schließen' : '+ Neu'}
			</button>
		</div>

		<KindTabs active={activeKind} {counts} onselect={(k) => (activeKind = k)} />

		<div class="filter-row">
			<StatusFilter active={activeStatus} onselect={(s) => (activeStatus = s)} />
			<label class="fav-toggle">
				<input type="checkbox" bind:checked={showFavoritesOnly} />
				<span>Nur Favoriten</span>
			</label>
		</div>
	</div>

	{#if showCreate}
		<div class="inline-create">
			<EntryForm
				mode="create"
				initial={presetKind()
					? ({
							kind: presetKind()!,
							status: 'planned',
							title: '',
							originalTitle: null,
							creators: [],
							year: null,
							coverUrl: null,
							coverMediaId: null,
							rating: null,
							review: null,
							tags: [],
							genres: [],
							startedAt: null,
							completedAt: null,
							isFavorite: false,
							times: 0,
							externalIds: null,
							details:
								presetKind() === 'book'
									? { kind: 'book' }
									: presetKind() === 'movie'
										? { kind: 'movie' }
										: presetKind() === 'series'
											? { kind: 'series', watched: [] }
											: { kind: 'comic' },
							visibility: 'private',
							unlistedToken: '',
							unlistedExpiresAt: null,
							createdAt: '',
							updatedAt: '',
							id: '',
						} as LibraryEntry)
					: undefined}
				onclose={() => (showCreate = false)}
			/>
		</div>
	{/if}

	{#if entries$.loading}
		<p class="muted center">Lädt…</p>
	{:else}
		<GridView entries={filtered} onopen={openEntry} />
	{/if}
</div>

<style>
	.library-shell {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.muted.center {
		text-align: center;
		margin-top: 2rem;
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.search-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.create-btn {
		padding: 0.45rem 0.9rem;
		border-radius: 0.55rem;
		border: 1px solid #a855f7;
		background: #a855f7;
		color: white;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.create-btn:hover {
		background: #9333ea;
		border-color: #9333ea;
	}
	.create-btn.active {
		background: transparent;
		color: #a855f7;
	}
	.filter-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.fav-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
		cursor: pointer;
	}
	.search {
		flex: 1;
		min-width: 0;
		padding: 0.55rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
		font: inherit;
		color: inherit;
	}
	.search:focus {
		outline: 2px solid #a855f7;
		outline-offset: 1px;
		border-color: transparent;
	}
	.inline-create {
		margin-bottom: 1.25rem;
		border: 1px solid color-mix(in srgb, #a855f7 30%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, #a855f7 4%, transparent);
	}
</style>
