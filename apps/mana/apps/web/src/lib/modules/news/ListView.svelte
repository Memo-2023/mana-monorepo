<!--
  News — Workbench ListView.

  This is the version that renders inside an AppPage carousel slot, not
  the dedicated /news route. Two important differences from the route:

  1. We boot the feed-cache poll loop here too — a user might add the
     News card to a workbench scene without ever opening the /news route,
     and we don't want them to stare at an empty card.
  2. The onboarding wizard lives only on the /news route. Inside the
     compact workbench frame there's no room for a 3-step picker, so
     un-onboarded users get a CTA card pointing them at /news.

  Header is intentionally bare — the workbench AppPage already supplies
  the title bar and close/move/minimize controls.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ViewProps } from '$lib/app-registry';
	import {
		usePreferences,
		useCachedFeed,
		useReactions,
		formatRelativeTime,
	} from '$lib/modules/news/queries';
	import { rankFeed, buildReactionSets } from '$lib/modules/news/feed-engine';
	import { reactionsStore } from '$lib/modules/news/stores/reactions.svelte';
	import { articlesStore } from '$lib/modules/news/stores/articles.svelte';
	import { feedCacheStore } from '$lib/modules/news/stores/feed-cache.svelte';
	import type { LocalCachedArticle } from '$lib/modules/news/types';

	// We accept ViewProps for protocol compatibility but the workbench
	// view doesn't navigate within itself — every "open" jumps to the
	// dedicated /news routes. Empty destructure satisfies the $props()
	// declaration without referencing the props object (which would
	// trigger Svelte's "captured initial value" warning).
	const {}: ViewProps = $props();

	const prefs$ = usePreferences();
	const pool$ = useCachedFeed();
	const reactions$ = useReactions();

	const prefs = $derived(prefs$.value);
	const pool = $derived(pool$.value);
	const reactions = $derived(reactions$.value);

	const { dismissedIds, interestedIds } = $derived(buildReactionSets(reactions));
	const ranked = $derived(
		prefs.onboardingCompleted ? rankFeed(pool, { prefs, dismissedIds, interestedIds }) : []
	);

	onMount(() => {
		feedCacheStore.start();
	});
	onDestroy(() => {
		// Don't stop the poll — the /news layout uses it too and the
		// store dedupes via inFlight. Stopping here would race with a
		// concurrently-mounted /news route.
	});

	$effect(() => {
		if (!prefs.onboardingCompleted) return;
		void feedCacheStore.refresh({
			topics: prefs.selectedTopics,
			lang: prefs.preferredLanguages.length === 1 ? prefs.preferredLanguages[0] : 'all',
		});
	});

	async function react(
		article: LocalCachedArticle,
		kind: 'interested' | 'not_interested' | 'source_blocked'
	) {
		await reactionsStore.react({
			articleId: article.id,
			reaction: kind,
			topic: article.topic,
			sourceSlug: article.sourceSlug,
		});
		if (kind === 'interested') {
			await articlesStore.saveFromCurated(article);
		}
	}

	function open(article: LocalCachedArticle) {
		goto(`/news/${article.id}`);
	}

	async function refresh() {
		await feedCacheStore.refresh({
			topics: prefs.selectedTopics,
			lang: prefs.preferredLanguages.length === 1 ? prefs.preferredLanguages[0] : 'all',
		});
	}
</script>

<div class="wb-news">
	{#if !prefs.onboardingCompleted}
		<div class="cta">
			<p class="cta-title">News Hub einrichten</p>
			<p class="cta-hint">
				Wähle Themen, Sprachen und Quellen — danach erscheinen hier deine Artikel.
			</p>
			<a class="cta-btn" href="/news">Jetzt einrichten</a>
		</div>
	{:else}
		<div class="toolbar">
			<div class="counts">
				{ranked.length} Artikel
				{#if feedCacheStore.lastError}
					· <span class="err">Fehler</span>
				{/if}
			</div>
			<div class="tools">
				<button
					type="button"
					class="tool"
					onclick={refresh}
					disabled={feedCacheStore.inFlight}
					title="Neu laden"
				>
					{feedCacheStore.inFlight ? '…' : '↻'}
				</button>
				<a class="tool" href="/news/saved" title="Gespeichert">📑</a>
				<a class="tool" href="/news/preferences" title="Einstellungen">⚙</a>
			</div>
		</div>

		{#if ranked.length === 0}
			<div class="empty">
				{#if pool.length === 0}
					<p>Lade Artikel…</p>
				{:else}
					<p>Keine neuen Artikel.</p>
					<button type="button" class="link" onclick={refresh}>Neu laden</button>
				{/if}
			</div>
		{:else}
			<ul class="list">
				{#each ranked.slice(0, 30) as { article } (article.id)}
					<li class="item">
						{#if article.imageUrl}
							<button type="button" class="thumb" onclick={() => open(article)} aria-label="Öffnen">
								<img src={article.imageUrl} alt="" loading="lazy" />
							</button>
						{/if}
						<div class="body">
							<div class="meta">
								<span class="site">{article.siteName}</span>
								<span>·</span>
								<span>{formatRelativeTime(article.publishedAt)}</span>
							</div>
							<button type="button" class="title" onclick={() => open(article)}>
								{article.title}
							</button>
							<div class="actions">
								<button
									type="button"
									class="rxn"
									onclick={() => react(article, 'interested')}
									title="Interessiert"
								>
									❤️
								</button>
								<button
									type="button"
									class="rxn"
									onclick={() => react(article, 'not_interested')}
									title="Nicht für mich"
								>
									👎
								</button>
								<button
									type="button"
									class="rxn"
									onclick={() => react(article, 'source_blocked')}
									title="Quelle ausblenden"
								>
									🚫
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.wb-news {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.5rem 0.25rem;
		height: 100%;
		overflow: hidden;
	}

	.cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		text-align: center;
	}
	.cta-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.cta-hint {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.cta-btn {
		margin-top: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		text-decoration: none;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 0.25rem;
	}
	.counts {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.counts .err {
		color: hsl(var(--color-destructive));
	}
	.tools {
		display: flex;
		gap: 0.25rem;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.625rem;
		height: 1.625rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: none;
	}
	.tool:disabled {
		opacity: 0.5;
	}

	.empty {
		text-align: center;
		padding: 1.5rem 0;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}
	.link {
		background: none;
		border: none;
		color: hsl(var(--color-primary));
		cursor: pointer;
		text-decoration: underline;
		font-size: 0.8125rem;
		margin-top: 0.25rem;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		flex: 1;
	}
	.item {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.625rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}
	.thumb {
		width: 64px;
		height: 48px;
		border: none;
		padding: 0;
		background: hsl(var(--color-background));
		border-radius: 0.375rem;
		overflow: hidden;
		cursor: pointer;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}
	.meta {
		display: flex;
		gap: 0.3rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.meta .site {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.title {
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1.3;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.title:hover {
		color: hsl(var(--color-primary));
	}
	.actions {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.125rem;
	}
	.rxn {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		font-size: 0.75rem;
	}
</style>
