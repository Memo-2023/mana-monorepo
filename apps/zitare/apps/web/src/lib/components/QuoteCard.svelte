<script lang="ts">
	import type { Quote, Category } from '@zitare/content';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import { _ } from 'svelte-i18n';

	interface Props {
		quote: Quote;
		showCategory?: boolean;
		showSource?: boolean;
		size?: 'small' | 'medium' | 'large';
	}

	let { quote, showCategory = false, showSource = true, size = 'medium' }: Props = $props();

	let isFavorite = $derived(favoritesStore.isFavorite(quote.id));
	let quoteText = $derived(quotesStore.getText(quote));

	// Category gradient classes
	const categoryGradients: Record<Category, string> = {
		weisheit: 'quote-gradient-wisdom',
		motivation: 'quote-gradient-motivation',
		liebe: 'quote-gradient-love',
		leben: 'quote-gradient-life',
		erfolg: 'quote-gradient-success',
		glueck: 'quote-gradient-happiness',
		freundschaft: 'quote-gradient-friendship',
		mut: 'quote-gradient-courage',
		hoffnung: 'quote-gradient-hope',
		natur: 'quote-gradient-nature',
	};

	// Category labels
	const categoryLabels: Record<Category, string> = {
		weisheit: 'categories.wisdom',
		motivation: 'categories.motivation',
		liebe: 'categories.love',
		leben: 'categories.life',
		erfolg: 'categories.success',
		glueck: 'categories.happiness',
		freundschaft: 'categories.friendship',
		mut: 'categories.courage',
		hoffnung: 'categories.hope',
		natur: 'categories.nature',
	};

	async function toggleFavorite() {
		if (!authStore.isAuthenticated) return;
		const wasFavorite = isFavorite;
		await favoritesStore.toggle(quote.id);
		if (wasFavorite) {
			ZitareEvents.quoteUnfavorited();
		} else {
			ZitareEvents.quoteFavorited(quote.category);
		}
	}

	async function shareQuote() {
		const text = `"${quoteText}" — ${quote.author}`;
		if (navigator.share) {
			await navigator.share({
				text,
				title: 'Zitare',
			});
		} else {
			await navigator.clipboard.writeText(text);
		}
		ZitareEvents.quoteShared(quote.category);
	}

	const sizeClasses = {
		small: 'p-4 text-base',
		medium: 'p-6 text-lg',
		large: 'p-8 text-xl md:text-2xl',
	};
</script>

<div
	class="quote-card rounded-2xl bg-surface-elevated shadow-lg overflow-hidden {sizeClasses[size]}"
>
	{#if showCategory}
		<div class="mb-4">
			<span
				class="inline-block px-3 py-1 rounded-full text-sm font-medium text-white {categoryGradients[
					quote.category
				]}"
			>
				{$_(categoryLabels[quote.category])}
			</span>
		</div>
	{/if}

	<blockquote class="quote-text text-foreground mb-4">
		"{quoteText}"
	</blockquote>

	<div class="flex items-center justify-between">
		<div>
			<p class="quote-author text-foreground-secondary">— {quote.author}</p>
			{#if showSource && (quote.source || quote.year)}
				<p class="text-sm text-foreground-muted mt-1">
					{#if quote.source}
						{quote.source}
					{/if}
					{#if quote.source && quote.year}
						·
					{/if}
					{#if quote.year}
						{quote.year}
					{/if}
				</p>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={shareQuote}
				class="p-2 rounded-full hover:bg-surface-hover transition-colors"
				aria-label={$_('home.share')}
			>
				<svg
					class="w-5 h-5 text-foreground-secondary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
					/>
				</svg>
			</button>

			{#if authStore.isAuthenticated}
				<button
					onclick={toggleFavorite}
					class="p-2 rounded-full hover:bg-surface-hover transition-colors"
					aria-label={isFavorite ? $_('home.unfavorite') : $_('home.favorite')}
				>
					<svg
						class="w-5 h-5 transition-colors {isFavorite
							? 'text-red-500 fill-red-500'
							: 'text-foreground-secondary'}"
						fill={isFavorite ? 'currentColor' : 'none'}
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
</div>
