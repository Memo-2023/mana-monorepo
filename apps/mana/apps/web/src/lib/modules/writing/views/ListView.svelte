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
	import { _ } from 'svelte-i18n';
	import { onMount, type Component } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Palette,
		NotePencil,
		Sparkle,
		Newspaper,
		Notebook,
		Envelope,
		ChatCircle,
		BookOpen,
		Microphone,
	} from '@mana/shared-icons';
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

	/**
	 * Phosphor-icon mapping for the quick-start tiles (and any other
	 * UI surface that needs an icon-not-emoji affordance per kind). The
	 * KIND_LABELS map still carries an `emoji` field for places that
	 * lean on it (KindTabs in the populated state, etc.) — this lookup
	 * is the icon-only equivalent for the workbench card hero.
	 */
	const QUICK_ICON: Record<DraftKind, Component> = {
		blog: Newspaper,
		essay: Notebook,
		email: Envelope,
		social: ChatCircle,
		letter: Envelope,
		speech: Microphone,
		story: BookOpen,
		'cover-letter': Envelope,
		'product-description': Notebook,
		'press-release': Newspaper,
		bio: NotePencil,
		other: NotePencil,
	};

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
				placeholder={$_('writing.list_view.search_placeholder')}
			/>
		{/if}
		<a
			href="/writing/styles"
			class="styles-link"
			title={$_('writing.list_view.styles_title')}
			aria-label={$_('writing.list_view.styles_title')}
		>
			<Palette size={18} weight="regular" />
		</a>
		<button
			type="button"
			class="create-btn"
			class:active={showCreate}
			onclick={() => (showCreate = !showCreate)}
			aria-expanded={showCreate}
		>
			{showCreate ? $_('writing.list_view.close_btn') : $_('writing.list_view.new_draft_btn')}
		</button>
	</div>

	{#if !isEmpty}
		<div class="filter-stack">
			<KindTabs active={activeKind} {counts} onselect={(k) => (activeKind = k)} />
			<div class="filter-row">
				<StatusFilter active={activeStatus} onselect={(s) => (activeStatus = s)} />
				<label class="fav-toggle">
					<input type="checkbox" bind:checked={showFavoritesOnly} />
					<span>{$_('writing.list_view.fav_only')}</span>
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
		<p class="muted center">{$_('writing.list_view.loading')}</p>
	{:else if isEmpty && !showCreate}
		<!-- Hero empty-state: the "What is this?" view. -->
		<section class="hero">
			<div class="hero-icon" aria-hidden="true">
				<NotePencil size={40} weight="duotone" />
			</div>
			<h2>{$_('writing.list_view.hero_title')}</h2>
			<p class="hero-pitch">{$_('writing.list_view.hero_pitch')}</p>
			<ul class="hero-meta">
				<li><Sparkle size={12} weight="fill" /> {$_('writing.list_view.hero_meta_kinds')}</li>
				<li>{$_('writing.list_view.hero_meta_styles')}</li>
				<li>{$_('writing.list_view.hero_meta_references')}</li>
				<li>{$_('writing.list_view.hero_meta_e2e')}</li>
			</ul>

			<div class="quick-start">
				<p class="quick-start-label">{$_('writing.list_view.quick_start_label')}</p>
				<div class="quick-grid">
					{#each QUICK_START_KINDS as kind (kind)}
						{@const Icon = QUICK_ICON[kind]}
						<button
							type="button"
							class="quick-tile"
							onclick={() => startWithKind(kind)}
							title={$_('writing.list_view.quick_start_title_template', {
								values: { kind: $_('writing.kinds.' + kind) },
							})}
						>
							<span class="quick-icon" aria-hidden="true">
								<Icon size={20} weight="regular" />
							</span>
							<span class="quick-label">{$_('writing.kinds.' + kind)}</span>
						</button>
					{/each}
				</div>
			</div>
		</section>
	{:else if filtered.length === 0}
		<div class="empty">
			<p class="muted">{$_('writing.list_view.empty_filtered')}</p>
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
		color: hsl(var(--color-muted-foreground));
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		flex-shrink: 0;
	}
	.styles-link:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.create-btn {
		padding: 0.45rem 0.9rem;
		border-radius: 0.55rem;
		border: 1px solid hsl(var(--color-primary));
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.create-btn:hover {
		filter: brightness(0.92);
	}
	.create-btn.active {
		background: transparent;
		color: hsl(var(--color-primary));
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
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.search {
		flex: 1;
		min-width: 0;
		padding: 0.55rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font: inherit;
		color: hsl(var(--color-foreground));
	}
	.search:focus {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 1px;
		border-color: transparent;
	}
	.inline-create {
		margin-bottom: 1.25rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		border-radius: 0.75rem;
		background: hsl(var(--color-primary) / 0.04);
	}
	.empty {
		max-width: 540px;
		margin: 2rem auto;
		text-align: center;
	}
	.empty p {
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}

	.hero {
		max-width: 600px;
		margin: 1rem auto;
		padding: 1rem 0.5rem 1.5rem;
		text-align: center;
	}
	.hero-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.85rem;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		margin-bottom: 0.85rem;
	}
	.hero h2 {
		margin: 0 0 0.4rem;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.25;
		color: hsl(var(--color-foreground));
	}
	.hero-pitch {
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		margin: 0 auto 0.85rem;
		max-width: 460px;
		font-size: 0.9rem;
	}
	.hero-meta {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.35rem 0.75rem;
		list-style: none;
		padding: 0;
		margin: 0 auto 1.5rem;
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.hero-meta li {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.quick-start {
		margin-top: 0.5rem;
	}
	.quick-start-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 0.55rem;
		font-weight: 500;
	}
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		max-width: 360px;
		margin: 0 auto;
	}
	.quick-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.75rem 0.4rem;
		border-radius: 0.6rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		color: hsl(var(--color-foreground));
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			transform 0.1s ease;
	}
	.quick-tile:hover {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.06);
		color: hsl(var(--color-primary));
	}
	.quick-tile:active {
		transform: scale(0.98);
	}
	.quick-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-muted-foreground));
	}
	.quick-tile:hover .quick-icon {
		color: hsl(var(--color-primary));
	}
	.quick-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Below ~360px (narrow workbench card) drop to 2 cols. */
	@media (max-width: 360px) {
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
