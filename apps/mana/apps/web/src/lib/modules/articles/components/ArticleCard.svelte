<!--
  ArticleCard — shared card used by ListView, HomeView sections, and
  anywhere else an article needs a compact clickable preview.

  Two layout variants:
    - variant="row"      (default): full-width card, meta + title +
                         excerpt + tags. Used in vertical lists.
    - variant="compact"  slimmer, no excerpt, shows reading-progress
                         bar underneath — meant for horizontal
                         carousels (Continue-Reading section).

  Parent passes the article + an optional tag list; navigation is
  inlined so callers don't need to wire onclick themselves. A parent
  that wants a different destination (e.g. a list filter) can override
  via `href`.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { TagChip } from '@mana/shared-ui';
	import type { Article } from '../types';

	type CardTag = { id: string; name: string; color?: string | null };

	interface Props {
		article: Article;
		tags?: CardTag[];
		variant?: 'row' | 'compact';
		/** Override the default `/articles/<id>` navigation target. */
		href?: string;
	}

	let { article, tags = [], variant = 'row', href }: Props = $props();

	function openArticle() {
		goto(href ?? `/articles/${article.id}`);
	}

	const progressPercent = $derived(Math.round((article.readingProgress ?? 0) * 100));
</script>

<button type="button" class="article-card variant-{variant}" onclick={openArticle}>
	<div class="meta">
		{#if article.siteName}
			<span class="site">{article.siteName}</span>
		{/if}
		{#if article.readingTimeMinutes}
			<span class="reading-time">{article.readingTimeMinutes} min</span>
		{/if}
		{#if variant === 'row'}
			<span class="status status-{article.status}">{article.status}</span>
		{/if}
		{#if article.isFavorite}
			<span class="fav" aria-label="Favorit">★</span>
		{/if}
	</div>
	<div class="title">{article.title}</div>
	{#if variant === 'row' && article.excerpt}
		<div class="excerpt">{article.excerpt}</div>
	{/if}
	{#if variant === 'row' && tags.length > 0}
		<div class="tags">
			{#each tags as tag (tag.id)}
				<TagChip name={tag.name} color={tag.color} />
			{/each}
		</div>
	{/if}
	{#if variant === 'compact' && progressPercent > 0}
		<div class="progress" aria-label="Lesefortschritt {progressPercent}%">
			<div class="progress-bar" style:width="{progressPercent}%"></div>
		</div>
	{/if}
</button>

<style>
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
	.variant-compact {
		gap: 0.3rem;
		padding: 0.75rem 0.9rem;
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
	.variant-compact .title {
		font-size: 0.95rem;
		/* Limit to 3 lines so the card heights stay uniform in the carousel. */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
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
	.progress {
		margin-top: auto;
		height: 3px;
		border-radius: 999px;
		background: color-mix(in srgb, currentColor 8%, transparent);
		overflow: hidden;
	}
	.progress-bar {
		height: 100%;
		background: #f97316;
		transition: width 200ms ease;
	}
</style>
