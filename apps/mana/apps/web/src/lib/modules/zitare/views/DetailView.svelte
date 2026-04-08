<!--
  Zitare — DetailView
  Full quote detail with category, source, author bio, share, favorite.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { quotesStore } from '$lib/modules/zitare/stores/quotes.svelte';
	import { favoritesStore } from '$lib/modules/zitare/stores/favorites.svelte';
	import { isFavorite as checkIsFavorite, type Favorite } from '$lib/modules/zitare/queries';
	import { Heart, ShareNetwork, Info } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalFavorite } from '../types';
	import { QUOTES, type Quote, type Category } from '@zitare/content';

	let { navigate, goBack, params }: ViewProps = $props();
	let quoteId = $derived(params.quoteId as string);

	let favorites = $state<Favorite[]>([]);
	let showBio = $state(false);

	let quote = $derived(QUOTES.find((q) => q.id === quoteId) ?? null);
	let isFav = $derived(quote ? checkIsFavorite(favorites, quote.id) : false);
	let quoteText = $derived(quote ? quotesStore.getText(quote) : '');

	const categoryLabels: Record<Category, string> = {
		weisheit: 'Weisheit',
		motivation: 'Motivation',
		liebe: 'Liebe',
		leben: 'Leben',
		erfolg: 'Erfolg',
		glueck: 'Glück',
		freundschaft: 'Freundschaft',
		mut: 'Mut',
		hoffnung: 'Hoffnung',
		natur: 'Natur',
	};

	$effect(() => {
		quotesStore.initialize();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			const locals = await db.table<LocalFavorite>('zitareFavorites').toArray();
			return locals
				.filter((f) => !f.deletedAt)
				.map((f) => ({ id: f.id, quoteId: f.quoteId, createdAt: f.createdAt ?? '' }));
		}).subscribe((val) => {
			favorites = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	let authorBio = $derived(() => {
		if (!quote?.authorBio) return '';
		const lang = quotesStore.language === 'original' ? 'de' : quotesStore.language;
		return quote.authorBio[lang] || quote.authorBio.de || '';
	});

	async function toggleFav() {
		if (!quote) return;
		await favoritesStore.toggle(quote.id, favorites);
	}

	async function shareQuote() {
		if (!quote) return;
		const text = `"${quoteText}" — ${quote.author}`;
		if (navigator.share) {
			await navigator.share({ text, title: 'Zitare' });
		} else {
			await navigator.clipboard.writeText(text);
		}
	}
</script>

<div class="detail-view">
	{#if !quote}
		<p class="empty">Zitat nicht gefunden</p>
	{:else}
		<!-- Quote -->
		<blockquote class="quote-text">
			&ldquo;{quoteText}&rdquo;
		</blockquote>

		<!-- Author -->
		<div class="author-row">
			<span class="author-name">— {quote.author}</span>
			{#if authorBio()}
				<button class="bio-btn" onclick={() => (showBio = !showBio)}>
					<Info size={14} />
				</button>
			{/if}
		</div>

		{#if showBio && authorBio()}
			<p class="author-bio">{authorBio()}</p>
		{/if}

		<!-- Meta -->
		<div class="meta-row">
			<span class="category-badge">{categoryLabels[quote.category]}</span>
			{#if quote.source || quote.year}
				<span class="source-text">
					{#if quote.source}{quote.source}{/if}
					{#if quote.source && quote.year}
						&middot;
					{/if}
					{#if quote.year}{quote.year}{/if}
				</span>
			{/if}
		</div>

		<!-- Actions -->
		<div class="actions">
			<button class="action-btn" class:fav-active={isFav} onclick={toggleFav}>
				<Heart size={18} weight={isFav ? 'fill' : 'regular'} />
				<span>{isFav ? 'Gespeichert' : 'Speichern'}</span>
			</button>
			<button class="action-btn" onclick={shareQuote}>
				<ShareNetwork size={18} />
				<span>Teilen</span>
			</button>
		</div>
	{/if}
</div>

<style>
	/* P5: theme-token migration. All `:global(.dark)` paired rules and
	   hand-rolled #374151/#9ca3af palette removed — `var(--color-*)` from
	   @mana/shared-tailwind/themes.css handles light + dark automatically. */
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
	}

	.quote-text {
		font-size: 1.25rem;
		font-weight: 300;
		font-style: italic;
		line-height: 1.7;
		color: var(--color-foreground);
	}

	.author-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.author-name {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}
	.bio-btn {
		border: none;
		background: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		transition: color 0.15s;
	}
	.bio-btn:hover {
		color: var(--color-foreground);
	}

	.author-bio {
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--color-muted-foreground);
		line-height: 1.5;
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	/* Category badge keeps its brand color (violet-500) since it's a deliberate
	   accent that should not adopt the theme primary on accident. */
	.category-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, #8b5cf6 12%, transparent);
		color: #8b5cf6;
	}
	.source-text {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}
	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid var(--color-border);
		background: transparent;
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-foreground);
	}
	.action-btn.fav-active {
		color: var(--color-error, #ef4444);
		border-color: color-mix(in srgb, var(--color-error, #ef4444) 25%, transparent);
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 1rem;
		}
		.action-btn,
		.bio-btn {
			min-height: 44px;
		}
	}
</style>
