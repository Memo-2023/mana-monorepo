<!--
  Articles — ListView
  Filter chips (Alle | Ungelesen | In Arbeit | Favoriten | Archiv) + card
  list with per-card tag chips. Tag names + colours come from the global
  tags table via useAllTags; the per-article tag ids via a batched
  getTagIdsForMany to avoid N+1.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { TagChip } from '@mana/shared-ui';
	import { useAllArticles, useArticleTagMap } from './queries';
	import { useAllTags } from './stores/tags.svelte';
	import type { Article } from './types';

	type Filter = 'all' | 'unread' | 'reading' | 'finished' | 'favorites' | 'archived';

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Alle' },
		{ id: 'unread', label: 'Ungelesen' },
		{ id: 'reading', label: 'In Arbeit' },
		{ id: 'finished', label: 'Gelesen' },
		{ id: 'favorites', label: 'Favoriten' },
		{ id: 'archived', label: 'Archiv' },
	];

	const articles$ = useAllArticles();
	const articles = $derived(articles$.value);

	const tagMap$ = $derived.by(() => useArticleTagMap(articles.map((a) => a.id)));
	const allTags$ = useAllTags();

	let filter = $state<Filter>('all');

	const filtered = $derived.by(() => {
		const a = articles;
		switch (filter) {
			case 'all':
				return a.filter((x) => x.status !== 'archived');
			case 'unread':
				return a.filter((x) => x.status === 'unread');
			case 'reading':
				return a.filter((x) => x.status === 'reading');
			case 'finished':
				return a.filter((x) => x.status === 'finished');
			case 'favorites':
				return a.filter((x) => x.isFavorite && x.status !== 'archived');
			case 'archived':
				return a.filter((x) => x.status === 'archived');
		}
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

	function openArticle(a: Article) {
		goto(`/articles/${a.id}`);
	}
</script>

<div class="articles-shell">
	<header class="header">
		<div class="header-row">
			<div>
				<h1>Artikel</h1>
				<p class="subtitle">Später lesen — gespeicherte Web-Artikel, offline verfügbar.</p>
			</div>
			<div class="header-actions">
				<button
					type="button"
					class="icon-btn"
					title="Einstellungen — Bookmarklet + Share-Target"
					aria-label="Artikel-Einstellungen"
					onclick={() => goto('/articles/settings')}
				>
					⚙
				</button>
				<button type="button" class="add-btn" onclick={() => goto('/articles/add')}>
					+ Neu speichern
				</button>
			</div>
		</div>

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
	</header>

	{#if articles$.loading}
		<p class="muted center">Lädt…</p>
	{:else if articles.length === 0}
		<div class="empty-state">
			<p class="empty-headline">Noch nichts gespeichert.</p>
			<p class="empty-sub">
				URL einfügen, der Server extrahiert den Artikel mit Readability, alles bleibt verschlüsselt
				offline verfügbar.
			</p>
			<button type="button" class="add-btn" onclick={() => goto('/articles/add')}>
				Erste URL speichern
			</button>
		</div>
	{:else if filtered.length === 0}
		<div class="empty-state">
			<p class="empty-headline">Nichts in diesem Filter.</p>
			<p class="empty-sub">Probier einen anderen Filter oder speichere weitere Artikel.</p>
		</div>
	{:else}
		<ul class="article-list">
			{#each filtered as article (article.id)}
				{@const articleTags = tagsFor(article)}
				<li>
					<button type="button" class="article-card" onclick={() => openArticle(article)}>
						<div class="meta">
							{#if article.siteName}
								<span class="site">{article.siteName}</span>
							{/if}
							{#if article.readingTimeMinutes}
								<span class="reading-time">{article.readingTimeMinutes} min</span>
							{/if}
							<span class="status status-{article.status}">{article.status}</span>
							{#if article.isFavorite}
								<span class="fav" title="Favorit">★</span>
							{/if}
						</div>
						<div class="title">{article.title}</div>
						{#if article.excerpt}
							<div class="excerpt">{article.excerpt}</div>
						{/if}
						{#if articleTags.length > 0}
							<div class="tags">
								{#each articleTags as tag (tag.id)}
									<TagChip name={tag.name} color={tag.color} />
								{/each}
							</div>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.articles-shell {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.header {
		margin-bottom: 1.25rem;
	}
	.header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
	}
	.header-actions {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-shrink: 0;
	}
	.icon-btn {
		padding: 0.5rem 0.65rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}
	.icon-btn:hover {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.3));
	}
	.add-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		border: 1px solid #f97316;
		background: #f97316;
		color: white;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.add-btn:hover {
		background: #ea580c;
		border-color: #ea580c;
	}
	.subtitle {
		color: var(--color-text-muted, #64748b);
		margin: 0;
		font-size: 0.95rem;
	}
	.filter-row {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.filter-chip {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		background: transparent;
		color: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.filter-chip:hover {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.25));
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
	.article-card {
		width: 100%;
		text-align: left;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		border-radius: 0.6rem;
		background: var(--color-surface, transparent);
		color: inherit;
		font: inherit;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.article-card:hover {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.2));
	}
	.meta {
		display: flex;
		gap: 0.6rem;
		font-size: 0.75rem;
		color: var(--color-text-muted, #64748b);
		align-items: center;
	}
	.site {
		font-weight: 500;
	}
	.status {
		padding: 0.08rem 0.45rem;
		border-radius: 999px;
		font-size: 0.7rem;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}
	.status-finished {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.status-reading {
		background: rgba(249, 115, 22, 0.12);
		color: #f97316;
	}
	.status-archived {
		background: rgba(100, 116, 139, 0.15);
		color: #64748b;
	}
	.fav {
		color: #f59e0b;
	}
	.title {
		font-weight: 600;
		font-size: 1rem;
		line-height: 1.35;
	}
	.excerpt {
		color: var(--color-text-muted, #64748b);
		font-size: 0.88rem;
		line-height: 1.4;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.tags {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		margin-top: 0.1rem;
	}
</style>
