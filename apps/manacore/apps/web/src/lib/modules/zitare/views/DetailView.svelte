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
	import { Heart, ShareNetwork, Info } from '@manacore/shared-icons';
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
		color: #9ca3af;
	}

	.quote-text {
		font-size: 1.25rem;
		font-weight: 300;
		font-style: italic;
		line-height: 1.7;
		color: #374151;
	}
	:global(.dark) .quote-text {
		color: #e5e7eb;
	}

	.author-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.author-name {
		font-size: 0.875rem;
		color: #9ca3af;
	}
	.bio-btn {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		transition: color 0.15s;
	}
	.bio-btn:hover {
		color: #6b7280;
	}

	.author-bio {
		font-size: 0.8125rem;
		font-style: italic;
		color: #9ca3af;
		line-height: 1.5;
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.category-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
	}
	:global(.dark) .category-badge {
		background: rgba(139, 92, 246, 0.15);
	}
	.source-text {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .actions {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.75rem;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #6b7280;
	}
	.action-btn.fav-active {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}
	:global(.dark) .action-btn.fav-active {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
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
