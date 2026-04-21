<!--
  Articles — ListView (M1 skeleton)
  Shows saved articles sorted by savedAt desc. Empty-state points
  at /articles/add (route lands in M2). Typography, reader, highlights,
  tags, filters all land in later milestones.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllArticles } from './queries';
	import type { Article } from './types';

	const articles$ = useAllArticles();
	const articles = $derived(articles$.value);

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
			<button type="button" class="add-btn" onclick={() => goto('/articles/add')}>
				+ Neu speichern
			</button>
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
	{:else}
		<ul class="article-list">
			{#each articles as article (article.id)}
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
						</div>
						<div class="title">{article.title}</div>
						{#if article.excerpt}
							<div class="excerpt">{article.excerpt}</div>
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
		margin-bottom: 1.5rem;
	}
	.header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
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
	.status-archived {
		background: rgba(100, 116, 139, 0.15);
		color: #64748b;
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
</style>
