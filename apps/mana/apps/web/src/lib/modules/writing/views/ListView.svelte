<!--
  Writing — ListView.
  Grid of drafts with KindTabs + status chips + search + "+ Neu" inline-create.
  Clicking a card routes to /writing/draft/[id]. The draft preview shows the
  first ~160 chars of the current version so the card isn't empty for an
  unstarted draft.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import KindTabs from '../components/KindTabs.svelte';
	import StatusFilter from '../components/StatusFilter.svelte';
	import DraftCard from '../components/DraftCard.svelte';
	import BriefingForm from '../components/BriefingForm.svelte';
	import {
		useAllDrafts,
		filterByKind,
		filterByStatus,
		searchDrafts,
		sortByUpdated,
	} from '../queries';
	import { draftVersionTable } from '../collections';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { decryptRecords } from '$lib/data/crypto';
	import { toDraftVersion } from '../queries';
	import type { Draft, DraftVersion, DraftKind, DraftStatus, LocalDraftVersion } from '../types';

	const drafts$ = useAllDrafts();
	const drafts = $derived(drafts$.value);

	// Pull every version for the drafts we show so we can look up each
	// card's current version by id without a per-card live query. On the
	// list page we only need the wordCount + first 160 chars, so the whole
	// content is fine to read (decryption is the same either way).
	const currentVersions$ = useLiveQueryWithDefault(async () => {
		const ids = drafts.map((d) => d.currentVersionId).filter((id): id is string => !!id);
		if (ids.length === 0) return new Map<string, DraftVersion>();
		const rows = (await draftVersionTable.bulkGet(ids)).filter(
			(r): r is LocalDraftVersion => !!r && !r.deletedAt
		);
		const decrypted = await decryptRecords('writingDraftVersions', rows);
		const map = new Map<string, DraftVersion>();
		for (const v of decrypted.map(toDraftVersion)) map.set(v.id, v);
		return map;
	}, new Map<string, DraftVersion>());
	const currentVersionsById = $derived(currentVersions$.value);

	let activeKind = $state<DraftKind | 'all'>('all');
	let activeStatus = $state<DraftStatus | null>(null);
	let searchQuery = $state('');
	let showFavoritesOnly = $state(false);
	let showCreate = $state(false);

	const counts = $derived<Record<DraftKind, number>>({
		blog: drafts.filter((d) => d.kind === 'blog').length,
		essay: drafts.filter((d) => d.kind === 'essay').length,
		email: drafts.filter((d) => d.kind === 'email').length,
		social: drafts.filter((d) => d.kind === 'social').length,
		story: drafts.filter((d) => d.kind === 'story').length,
		letter: drafts.filter((d) => d.kind === 'letter').length,
		speech: drafts.filter((d) => d.kind === 'speech').length,
		'cover-letter': drafts.filter((d) => d.kind === 'cover-letter').length,
		'product-description': drafts.filter((d) => d.kind === 'product-description').length,
		'press-release': drafts.filter((d) => d.kind === 'press-release').length,
		bio: drafts.filter((d) => d.kind === 'bio').length,
		other: drafts.filter((d) => d.kind === 'other').length,
	});

	const filtered = $derived.by(() => {
		let result = drafts;
		if (activeKind !== 'all') result = filterByKind(result, activeKind);
		if (activeStatus) result = filterByStatus(result, activeStatus);
		if (showFavoritesOnly) result = result.filter((d) => d.isFavorite);
		if (searchQuery.trim()) result = searchDrafts(result, searchQuery.trim());
		return sortByUpdated(result);
	});

	function openDraft(d: Draft) {
		goto(`/writing/draft/${d.id}`);
	}

	function presetKind(): DraftKind | undefined {
		return activeKind === 'all' ? undefined : activeKind;
	}

	function onCreated(d: Draft) {
		showCreate = false;
		openDraft(d);
	}

	// Workbench "Neuer Draft" context-menu action. Uses the shared
	// mana:quick-action event channel that the app-registry dispatches
	// from the card's kebab menu. Also fires when the user picks the
	// action from the command palette once that's wired up globally.
	onMount(() => {
		function handleQuickAction(ev: Event) {
			const detail = (ev as CustomEvent<{ app?: string; action?: string }>).detail;
			if (detail?.app === 'writing' && detail?.action === 'new') {
				showCreate = true;
			}
		}
		window.addEventListener('mana:quick-action', handleQuickAction);
		return () => window.removeEventListener('mana:quick-action', handleQuickAction);
	});
</script>

<div class="writing-shell">
	<div class="controls">
		<div class="search-row">
			<input
				type="search"
				class="search"
				bind:value={searchQuery}
				placeholder="Nach Titel oder Thema suchen…"
			/>
			<a href="/writing/styles" class="styles-link" title="Stile verwalten">🎨 Stile</a>
			<button
				type="button"
				class="create-btn"
				class:active={showCreate}
				onclick={() => (showCreate = !showCreate)}
				aria-expanded={showCreate}
			>
				{showCreate ? '× Schließen' : '+ Neuer Draft'}
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
			<BriefingForm
				mode="create"
				initialKind={presetKind()}
				onclose={() => (showCreate = false)}
				oncreated={onCreated}
			/>
		</div>
	{/if}

	{#if drafts$.loading}
		<p class="muted center">Lädt…</p>
	{:else if filtered.length === 0}
		<div class="empty">
			{#if drafts.length === 0}
				<h2>Noch keine Drafts</h2>
				<p>
					Klick auf <strong>+ Neuer Draft</strong>, brief dem Ghostwriter Thema, Stil und Länge — M3
					ergänzt die Generate-Funktion. Bis dahin kannst du Drafts manuell erstellen und editieren.
				</p>
			{:else}
				<p class="muted">Keine Drafts passen zum aktuellen Filter.</p>
			{/if}
		</div>
	{:else}
		<div class="grid">
			{#each filtered as draft (draft.id)}
				<DraftCard
					{draft}
					currentVersion={currentVersionsById.get(draft.currentVersionId ?? '') ?? null}
					onopen={openDraft}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.writing-shell {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.muted {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
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
	.styles-link {
		padding: 0.45rem 0.75rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		color: inherit;
		text-decoration: none;
		font-size: 0.85rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.styles-link:hover {
		border-color: #0ea5e9;
		color: #0ea5e9;
	}
	.create-btn {
		padding: 0.45rem 0.9rem;
		border-radius: 0.55rem;
		border: 1px solid #0ea5e9;
		background: #0ea5e9;
		color: white;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.create-btn:hover {
		background: #0284c7;
		border-color: #0284c7;
	}
	.create-btn.active {
		background: transparent;
		color: #0ea5e9;
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
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
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
		outline: 2px solid #0ea5e9;
		outline-offset: 1px;
		border-color: transparent;
	}
	.inline-create {
		margin-bottom: 1.25rem;
		border: 1px solid color-mix(in srgb, #0ea5e9 30%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, #0ea5e9 4%, transparent);
	}
	.empty {
		max-width: 540px;
		margin: 3rem auto;
		text-align: center;
	}
	.empty h2 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
	}
	.empty p {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		line-height: 1.5;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.9rem;
	}
</style>
