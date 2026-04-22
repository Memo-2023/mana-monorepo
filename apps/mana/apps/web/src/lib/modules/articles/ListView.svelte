<!--
  Articles — ListView
  Filter chips (Alle | Ungelesen | In Arbeit | Favoriten | Archiv) + card
  list with per-card tag chips. Tag names + colours come from the global
  tags table via useAllTags; the per-article tag ids via a batched
  getTagIdsForMany to avoid N+1.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';
	import ArticleCard from './components/ArticleCard.svelte';
	import HomeSectionWeiterlesen from './components/HomeSectionWeiterlesen.svelte';
	import { useAllArticles, useArticleTagMap } from './queries';
	import { useAllTags } from './stores/tags.svelte';
	import type { Article } from './types';

	type Filter = 'all' | 'unread' | 'reading' | 'finished' | 'favorites' | 'archived';
	const ALLOWED_FILTERS: Filter[] = [
		'all',
		'unread',
		'reading',
		'finished',
		'favorites',
		'archived',
	];

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Alle' },
		{ id: 'unread', label: 'Ungelesen' },
		{ id: 'reading', label: 'In Arbeit' },
		{ id: 'finished', label: 'Gelesen' },
		{ id: 'favorites', label: 'Favoriten' },
		{ id: 'archived', label: 'Archiv' },
	];

	interface Props {
		/** Pre-selected filter (Workbench / Tab-Shell context). Wenn gesetzt,
		 *  überstimmt er den URL-Query-Param. */
		initialFilter?: Filter;
	}
	let { initialFilter }: Props = $props();

	const articles$ = useAllArticles();
	const articles = $derived(articles$.value);

	const tagMap$ = $derived.by(() => useArticleTagMap(articles.map((a) => a.id)));
	const allTags$ = useAllTags();

	// initialFilter ist ein einmaliger Seed (Shell-Tabs mounten ListView
	// immer frisch — es gibt keinen Case wo der Prop sich live ändert).
	// untrack() sagt Svelte explizit, dass das kein state_referenced_locally-
	// Unfall ist.
	let filter = $state<Filter>(untrack(() => initialFilter ?? 'all'));
	let siteFilter = $state<string | null>(null);
	let tagFilter = $state<string | null>(null);

	// Deep-link support via Query-Param — nur wenn KEIN initialFilter-Prop
	// gesetzt wurde (sonst gewinnt die Shell). In der Shell wird die
	// ListView ohne URL-Sync gerendert; die direkten /articles/list-
	// Routen dagegen haben die Params.
	onMount(() => {
		if (initialFilter) {
			untrack(() => {
				siteFilter = null;
				tagFilter = null;
			});
			return;
		}
		const params = $page.url.searchParams;
		const f = params.get('filter');
		if (f && (ALLOWED_FILTERS as string[]).includes(f)) {
			filter = f as Filter;
		}
		siteFilter = params.get('site') || null;
		tagFilter = params.get('tag') || null;
	});

	// Continue-Reading-Strip: erscheint nur wenn Filter 'all' oder 'reading'
	// ist — auf anderen Filtern ist es verwirrend (ungelesen / archiv etc.
	// haben nichts mit "weiterlesen" zu tun).
	const readingArticles = $derived(articles.filter((a) => a.status === 'reading'));
	const showContinueReading = $derived(
		readingArticles.length > 0 && (filter === 'all' || filter === 'reading')
	);

	function matchesStatus(a: Article, f: Filter): boolean {
		switch (f) {
			case 'all':
				return a.status !== 'archived';
			case 'unread':
				return a.status === 'unread';
			case 'reading':
				return a.status === 'reading';
			case 'finished':
				return a.status === 'finished';
			case 'favorites':
				return a.isFavorite && a.status !== 'archived';
			case 'archived':
				return a.status === 'archived';
		}
	}

	const filtered = $derived.by(() => {
		let result = articles.filter((a) => matchesStatus(a, filter));
		if (siteFilter) {
			const needle = siteFilter.toLowerCase();
			result = result.filter((a) => (a.siteName ?? '').toLowerCase() === needle);
		}
		if (tagFilter) {
			result = result.filter((a) => (tagMap$.value.get(a.id) ?? []).includes(tagFilter!));
		}
		return result;
	});

	const counts = $derived.by(() => ({
		all: articles.filter((x) => x.status !== 'archived').length,
		unread: articles.filter((x) => x.status === 'unread').length,
		reading: articles.filter((x) => x.status === 'reading').length,
		finished: articles.filter((x) => x.status === 'finished').length,
		favorites: articles.filter((x) => x.isFavorite && x.status !== 'archived').length,
		archived: articles.filter((x) => x.status === 'archived').length,
	}));

	function tagsFor(article: Article) {
		const ids = tagMap$.value.get(article.id) ?? [];
		if (ids.length === 0) return [];
		const all = allTags$.value;
		return ids
			.map((id) => all.find((t) => t.id === id))
			.filter((t): t is (typeof all)[number] => !!t);
	}

	function clearSiteFilter() {
		siteFilter = null;
	}
	function clearTagFilter() {
		tagFilter = null;
	}
	const tagFilterLabel = $derived(
		tagFilter ? (allTags$.value.find((t) => t.id === tagFilter)?.name ?? tagFilter) : null
	);
</script>

<div class="list-view">
	{#if showContinueReading}
		<HomeSectionWeiterlesen articles={readingArticles} />
	{/if}

	<div class="filter-bar">
		<div class="filter-row" role="tablist" aria-label="Filter">
			{#each FILTERS as f (f.id)}
				<button
					type="button"
					class="filter-chip"
					class:active={filter === f.id}
					role="tab"
					aria-selected={filter === f.id}
					onclick={() => (filter = f.id)}
				>
					{f.label}
					<span class="count">{counts[f.id]}</span>
				</button>
			{/each}
		</div>

		{#if siteFilter || tagFilter}
			<div class="sub-filters" aria-label="Zusatz-Filter">
				{#if siteFilter}
					<button type="button" class="sub-filter" onclick={clearSiteFilter}>
						Quelle: {siteFilter} <span class="x">×</span>
					</button>
				{/if}
				{#if tagFilter}
					<button type="button" class="sub-filter" onclick={clearTagFilter}>
						Tag: {tagFilterLabel} <span class="x">×</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if articles$.loading}
		<p class="muted center">Lädt…</p>
	{:else if articles.length === 0}
		<div class="empty-state">
			<p class="empty-headline">Noch nichts gespeichert.</p>
			<p class="empty-sub">
				Geh auf die Übersicht und füge oben eine URL ein — der Server extrahiert den Artikel mit
				Readability, alles bleibt verschlüsselt offline verfügbar.
			</p>
		</div>
	{:else if filtered.length === 0}
		<div class="empty-state">
			<p class="empty-headline">Nichts in diesem Filter.</p>
			<p class="empty-sub">Probier einen anderen Filter oder speichere weitere Artikel.</p>
		</div>
	{:else}
		<ul class="article-list">
			{#each filtered as article (article.id)}
				<li>
					<ArticleCard {article} tags={tagsFor(article)} />
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.list-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.filter-bar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.filter-row {
		display: flex;
		gap: 0.35rem;
		flex-wrap: nowrap;
		overflow-x: auto;
		/* Schmale Scrollbar, damit die Chips auch auf Mobile ohne Umbruch
		 * erreichbar bleiben. `scroll-snap-type` macht das Scroll-Gefühl
		 * snappy — Chip für Chip einrasten statt frei gleiten. */
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
		/* Ein kleiner Fade am rechten Rand wäre schön, verzichten wir   */
		/* drauf — spart Komplexität, Browser zeigt seine native overflow-*/
		/* affordance.                                                    */
		padding-bottom: 0.25rem;
		margin-bottom: -0.25rem;
	}
	.filter-chip {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		/* Nicht-aktive Chips: leichte Hintergrund-Füllung + sichtbarer
		 * Border, damit sie klar als tappable Elements lesbar sind.
		 * currentColor-basierte Mixes adaptieren automatisch an Light/
		 * Sepia/Dark-Themes. */
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		background: color-mix(in srgb, currentColor 5%, transparent);
		color: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
		scroll-snap-align: start;
		white-space: nowrap;
	}
	.filter-chip:hover {
		border-color: color-mix(in srgb, currentColor 35%, transparent);
		background: color-mix(in srgb, currentColor 9%, transparent);
	}
	.filter-chip.active {
		background: #f97316;
		border-color: #f97316;
		color: white;
	}
	.filter-chip .count {
		font-size: 0.72rem;
		opacity: 0.8;
		padding: 0 0.35rem;
		background: color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 999px;
	}
	.sub-filters {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		margin-top: 0.6rem;
	}
	.sub-filter {
		font: inherit;
		font-size: 0.78rem;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, #f97316 40%, transparent);
		background: color-mix(in srgb, #f97316 10%, transparent);
		color: #ea580c;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.sub-filter .x {
		opacity: 0.7;
		font-weight: 600;
	}
	.sub-filter:hover .x {
		opacity: 1;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.muted.center {
		text-align: center;
		margin-top: 2rem;
	}
	.empty-state {
		margin-top: 3rem;
		padding: 2rem;
		text-align: center;
		border: 1px dashed var(--color-border, rgba(0, 0, 0, 0.15));
		border-radius: 0.75rem;
	}
	.empty-headline {
		margin: 0 0 0.5rem 0;
		font-weight: 600;
	}
	.empty-sub {
		margin: 0 0 1.25rem 0;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.article-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
