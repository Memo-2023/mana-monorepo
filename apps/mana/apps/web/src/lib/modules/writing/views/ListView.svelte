<!--
  Writing — ListView.

  Two states:
  - Has drafts → search + KindTabs + status filter + grid (the "I'm working" view)
  - Empty → hero pitch + 6 quick-start kind tiles (the "What is this?" view)

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
	import { KIND_LABELS } from '../constants';
	import type { Draft, DraftVersion, DraftKind, DraftStatus, LocalDraftVersion } from '../types';

	/**
	 * Quick-start kinds for the empty-state hero. The plan covers 12
	 * kinds total but six fit nicely in a 2x3 / 3x2 grid and these are
	 * the ones a first-time user is most likely to recognise. The full
	 * 12-kind picker is one click away inside the BriefingForm.
	 */
	const QUICK_START_KINDS: DraftKind[] = ['blog', 'essay', 'email', 'social', 'letter', 'speech'];

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

	/**
	 * Quick-start tile click — opens the BriefingForm with the picked
	 * kind pre-selected. Sets `activeKind` so `presetKind()` returns it
	 * to BriefingForm via initialKind.
	 */
	function startWithKind(kind: DraftKind) {
		activeKind = kind;
		showCreate = true;
	}

	const isEmpty = $derived(drafts$.value.length === 0 && !drafts$.loading);

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
	<!--
	  Top action bar is always visible — even in the empty state — so the
	  primary CTA stays in the same place. In empty mode the search +
	  filter rows are suppressed because filtering nothing is noise; the
	  Stile-Link drops to a small ghost button beside the CTA.
	-->
	<div class="action-bar" class:compact={isEmpty}>
		{#if !isEmpty}
			<input
				type="search"
				class="search"
				bind:value={searchQuery}
				placeholder="Nach Titel oder Thema suchen…"
			/>
		{/if}
		<a
			href="/writing/styles"
			class="styles-link"
			title="Stile verwalten"
			aria-label="Stile verwalten"
		>
			🎨
		</a>
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

	{#if !isEmpty}
		<div class="filter-stack">
			<KindTabs active={activeKind} {counts} onselect={(k) => (activeKind = k)} />
			<div class="filter-row">
				<StatusFilter active={activeStatus} onselect={(s) => (activeStatus = s)} />
				<label class="fav-toggle">
					<input type="checkbox" bind:checked={showFavoritesOnly} />
					<span>Nur Favoriten</span>
				</label>
			</div>
		</div>
	{/if}

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
	{:else if isEmpty && !showCreate}
		<!-- Hero empty-state: the "What is this?" view. -->
		<section class="hero">
			<div class="hero-icon" aria-hidden="true">📝</div>
			<h2>Dein KI-Ghostwriter</h2>
			<p class="hero-pitch">
				Brief Thema, Stil und Quellen — ein fertiger Entwurf entsteht. Verfeinere ihn absatzweise
				mit ⌘G zum Generieren, Markieren + Selection-Tools, oder direkt im Editor.
			</p>
			<p class="hero-meta">
				✨ 12 Textarten · 9 Stile · 7 Quellen-Typen · End-to-End-verschlüsselt
			</p>

			<div class="quick-start">
				<p class="quick-start-label">Schnellstart:</p>
				<div class="quick-grid">
					{#each QUICK_START_KINDS as kind (kind)}
						<button
							type="button"
							class="quick-tile"
							onclick={() => startWithKind(kind)}
							title={`Neuer ${KIND_LABELS[kind].de}-Entwurf`}
						>
							<span class="quick-emoji" aria-hidden="true">{KIND_LABELS[kind].emoji}</span>
							<span class="quick-label">{KIND_LABELS[kind].de}</span>
						</button>
					{/each}
				</div>
			</div>
		</section>
	{:else if filtered.length === 0}
		<div class="empty">
			<p class="muted">Keine Drafts passen zum aktuellen Filter.</p>
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
	.action-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.action-bar.compact {
		justify-content: flex-end;
		margin-bottom: 0.25rem;
	}
	.filter-stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.styles-link {
		padding: 0.4rem 0.55rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: transparent;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		text-decoration: none;
		font-size: 0.95rem;
		line-height: 1;
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
		margin: 2rem auto;
		text-align: center;
	}
	.empty p {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		line-height: 1.5;
	}

	.hero {
		max-width: 600px;
		margin: 1.5rem auto;
		padding: 1.5rem 1rem;
		text-align: center;
	}
	.hero-icon {
		font-size: 2.4rem;
		line-height: 1;
		margin-bottom: 0.75rem;
	}
	.hero h2 {
		margin: 0 0 0.5rem;
		font-size: 1.4rem;
		font-weight: 600;
	}
	.hero-pitch {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		line-height: 1.55;
		margin: 0 auto 1rem;
		max-width: 480px;
		font-size: 0.95rem;
	}
	.hero-meta {
		font-size: 0.75rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.45));
		margin: 0 0 1.75rem;
	}

	.quick-start {
		margin-top: 1rem;
	}
	.quick-start-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		margin: 0 0 0.6rem;
		font-weight: 500;
	}
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
	}
	.quick-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.85rem 0.5rem;
		border-radius: 0.65rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		cursor: pointer;
		font: inherit;
		color: inherit;
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			transform 0.1s ease;
	}
	.quick-tile:hover {
		border-color: #0ea5e9;
		background: color-mix(in srgb, #0ea5e9 6%, transparent);
		color: #0ea5e9;
	}
	.quick-tile:active {
		transform: scale(0.98);
	}
	.quick-emoji {
		font-size: 1.35rem;
		line-height: 1;
	}
	.quick-label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	@media (max-width: 480px) {
		.quick-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.9rem;
	}
</style>
