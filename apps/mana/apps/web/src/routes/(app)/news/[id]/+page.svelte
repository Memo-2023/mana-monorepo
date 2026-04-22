<!--
  Article reader.

  Resolves the [id] param two ways:
    1. If it matches a row in `newsCachedFeed` (curated pool), render
       that row directly.
    2. Otherwise, fall back to `newsArticles` (the saved reading list)
       and render through the decryption-aware `useArticle` hook.

  This dual-source lookup keeps the URL stable across "I just saved
  this article" → reload — both points end up at /news/<curated-id>.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { liveQuery } from 'dexie';
	import { cachedFeedTable, articleTable } from '$lib/modules/news/collections';
	import { decryptRecords } from '$lib/data/crypto';
	import { toArticle, formatRelativeTime } from '$lib/modules/news/queries';
	import { articlesStore } from '$lib/modules/news/stores/articles.svelte';
	import { reactionsStore } from '$lib/modules/news/stores/reactions.svelte';
	import type { LocalCachedArticle, Article } from '$lib/modules/news/types';
	import { RoutePage } from '$lib/components/shell';

	const id = $derived($page.params.id ?? '');

	type Loaded =
		| { kind: 'curated'; article: LocalCachedArticle }
		| { kind: 'saved'; article: Article }
		| { kind: 'missing' };

	let loaded = $state<Loaded | null>(null);

	$effect(() => {
		const currentId = id;
		if (!currentId) {
			loaded = { kind: 'missing' };
			return;
		}
		const obs = liveQuery(async () => {
			// Curated pool first.
			const cached = await cachedFeedTable.get(currentId);
			if (cached) return { kind: 'curated' as const, article: cached };
			// Saved list — by sourceCuratedId first, then by primary key.
			const savedByCurated = await articleTable.where('sourceCuratedId').equals(currentId).first();
			if (savedByCurated) {
				const [decrypted] = await decryptRecords('newsArticles', [savedByCurated]);
				return { kind: 'saved' as const, article: toArticle(decrypted) };
			}
			const savedById = await articleTable.get(currentId);
			if (savedById) {
				const [decrypted] = await decryptRecords('newsArticles', [savedById]);
				return { kind: 'saved' as const, article: toArticle(decrypted) };
			}
			return { kind: 'missing' as const };
		});
		const sub = obs.subscribe((value) => (loaded = value));
		return () => sub.unsubscribe();
	});

	const html = $derived(
		loaded && loaded.kind !== 'missing'
			? loaded.kind === 'curated'
				? loaded.article.htmlContent
				: loaded.article.htmlContent
			: null
	);
	const plain = $derived(
		loaded && loaded.kind !== 'missing'
			? loaded.kind === 'curated'
				? loaded.article.content
				: loaded.article.content
			: null
	);
	const title = $derived(loaded && loaded.kind !== 'missing' ? loaded.article.title : '');
	const meta = $derived.by(() => {
		if (!loaded || loaded.kind === 'missing') return null;
		const a = loaded.article;
		return {
			siteName: a.siteName,
			author: a.author,
			publishedAt: a.publishedAt,
			readingTimeMinutes: a.readingTimeMinutes,
			originalUrl: a.originalUrl,
			imageUrl: a.imageUrl,
		};
	});

	let fontSize = $state(1);

	async function saveAndStay() {
		if (!loaded || loaded.kind !== 'curated') return;
		await articlesStore.saveFromCurated(loaded.article);
		await reactionsStore.react({
			articleId: loaded.article.id,
			reaction: 'interested',
			topic: loaded.article.topic,
			sourceSlug: loaded.article.sourceSlug,
		});
	}
</script>

<svelte:head>
	<title>{title || 'Lese-Ansicht'} — Mana</title>
</svelte:head>

<RoutePage appId="news" backHref="/news" title="Artikel">
	<div class="reader-shell" style:--reader-font-size="{fontSize}rem">
		<header class="reader-bar">
			<button type="button" class="bar-btn" onclick={() => goto('/news')}>← Zurück</button>
			<div class="bar-spacer"></div>
			<button
				type="button"
				class="bar-btn"
				onclick={() => (fontSize = Math.max(0.875, fontSize - 0.0625))}
				title="Kleiner"
			>
				A−
			</button>
			<button
				type="button"
				class="bar-btn"
				onclick={() => (fontSize = Math.min(1.25, fontSize + 0.0625))}
				title="Größer"
			>
				A+
			</button>
			{#if loaded?.kind === 'curated'}
				<button type="button" class="bar-btn primary" onclick={saveAndStay}>❤️ Speichern</button>
			{/if}
		</header>

		{#if !loaded}
			<div class="placeholder">Lade…</div>
		{:else if loaded.kind === 'missing'}
			<div class="placeholder">
				<p>Artikel nicht gefunden.</p>
				<button type="button" class="bar-btn" onclick={() => goto('/news')}>Zurück zum Feed</button>
			</div>
		{:else}
			<article class="reader">
				{#if meta?.imageUrl}
					<img class="hero-image" src={meta.imageUrl} alt="" />
				{/if}
				<h1 class="reader-title">{title}</h1>
				<div class="reader-meta">
					{#if meta?.siteName}
						<span class="site">{meta.siteName}</span>
					{/if}
					{#if meta?.author}
						<span>·</span>
						<span>{meta.author}</span>
					{/if}
					{#if meta?.publishedAt}
						<span>·</span>
						<span>{formatRelativeTime(meta.publishedAt)}</span>
					{/if}
					{#if meta?.readingTimeMinutes}
						<span>·</span>
						<span>{meta.readingTimeMinutes} min</span>
					{/if}
				</div>

				{#if html}
					<!--
					Curated pool stores Mozilla Readability HTML which is
					already a stripped-down article DOM. We render it as-is
					through Svelte's @html. Source: news.curated_articles in
					our own backend, populated by the news-ingester service —
					so the trust boundary is "we trust our own ingester
					output", same as for chat/messages and notes/content.
				-->
					<div class="reader-content prose">{@html html}</div>
				{:else if plain}
					<div class="reader-content prose">
						{#each plain.split('\n\n') as para}
							<p>{para}</p>
						{/each}
					</div>
				{/if}

				{#if meta?.originalUrl}
					<footer class="reader-footer">
						<a class="external-link" href={meta.originalUrl} target="_blank" rel="noreferrer">
							Original öffnen ↗
						</a>
					</footer>
				{/if}
			</article>
		{/if}
	</div>
</RoutePage>

<style>
	.reader-shell {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1rem 4rem;
	}

	.reader-bar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0;
		background: hsl(var(--color-background) / 0.85);
		backdrop-filter: blur(8px);
	}
	.bar-spacer {
		flex: 1;
	}
	.bar-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.bar-btn.primary {
		background: hsl(var(--color-primary));
		color: white;
		border-color: hsl(var(--color-primary));
	}

	.placeholder {
		text-align: center;
		padding: 4rem 0;
		color: hsl(var(--color-muted-foreground));
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.reader {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
	}

	.hero-image {
		width: 100%;
		max-height: 360px;
		object-fit: cover;
		border-radius: 0.75rem;
	}

	.reader-title {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
		color: hsl(var(--color-foreground));
	}

	.reader-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.reader-meta .site {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.reader-content {
		font-size: var(--reader-font-size, 1rem);
		line-height: 1.7;
		color: hsl(var(--color-foreground));
	}
	.reader-content :global(p) {
		margin: 1rem 0;
	}
	.reader-content :global(h2),
	.reader-content :global(h3) {
		margin-top: 1.75rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
	}
	.reader-content :global(h2) {
		font-size: 1.4em;
	}
	.reader-content :global(h3) {
		font-size: 1.15em;
	}
	.reader-content :global(a) {
		color: hsl(var(--color-primary));
		text-decoration: underline;
	}
	.reader-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	.reader-content :global(blockquote) {
		border-left: 3px solid hsl(var(--color-primary));
		padding: 0.5rem 1rem;
		margin: 1rem 0;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}
	.reader-content :global(pre) {
		background: hsl(var(--color-muted));
		padding: 0.75rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	}
	.reader-content :global(code) {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 0.92em;
	}

	.reader-footer {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}
	.external-link {
		color: hsl(var(--color-primary));
		text-decoration: none;
		font-size: 0.875rem;
	}
	.external-link:hover {
		text-decoration: underline;
	}
</style>
