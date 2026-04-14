<script lang="ts">
	import type { Quote, Category } from '@quotes/content';
	import { quotesStore } from '$lib/modules/quotes/stores/quotes.svelte';
	import { favoritesStore } from '$lib/modules/quotes/stores/favorites.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { QuotesEvents } from '@mana/shared-utils/analytics';
	import { toast } from '$lib/stores/toast.svelte';
	import { quotesSettings } from '$lib/modules/quotes/stores/settings.svelte';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { isFavorite as checkIsFavorite, type Favorite } from '$lib/modules/quotes/queries';
	import { Info, ShareNetwork, Heart } from '@mana/shared-icons';

	interface Props {
		quote: Quote;
		showCategory?: boolean;
		showSource?: boolean;
		size?: 'small' | 'medium' | 'large';
	}

	let { quote, showCategory = false, showSource = true, size = 'medium' }: Props = $props();

	const allFavorites: { readonly value: Favorite[] } = getContext('favorites');
	let isFavorite = $derived(checkIsFavorite(allFavorites.value, quote.id));
	let quoteText = $derived(quotesStore.getText(quote));
	let showBio = $state(false);

	// Get author bio in current language. `$derived.by` is the variant
	// that takes a thunk; plain `$derived(expr)` would have stored the
	// arrow function itself, making `authorBioText` always truthy and
	// the {#if} below dead.
	let authorBioText = $derived.by(() => {
		if (!quote.authorBio) return '';
		const lang = quotesStore.language === 'original' ? 'de' : quotesStore.language;
		return quote.authorBio[lang] || quote.authorBio.de || '';
	});

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
		humor: 'quote-gradient-humor',
		wissenschaft: 'quote-gradient-science',
		kunst: 'quote-gradient-art',
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
		humor: 'categories.humor',
		wissenschaft: 'categories.science',
		kunst: 'categories.art',
	};

	async function toggleFavorite() {
		if (!authStore.isAuthenticated) return;
		const wasFavorite = isFavorite;
		try {
			await favoritesStore.toggle(quote.id, allFavorites.value);
			if (wasFavorite) {
				QuotesEvents.quoteUnfavorited();
			} else {
				QuotesEvents.quoteFavorited(quote.category);
			}
		} catch {
			toast.error($_('common.error'));
		}
	}

	async function shareQuote() {
		const text = `"${quoteText}" — ${quote.author}`;
		if (navigator.share) {
			await navigator.share({
				text,
				title: 'Quotes',
			});
		} else {
			await navigator.clipboard.writeText(text);
		}
		QuotesEvents.quoteShared(quote.category);
	}

	const sizeClasses = {
		small: 'p-4 text-base',
		medium: 'p-6 text-lg',
		large: 'p-8 text-xl md:text-2xl',
	};
</script>

<div
	class="quote-card rounded-2xl bg-surface-elevated shadow-lg overflow-hidden {sizeClasses[size]}"
	style="font-size: {quotesSettings.fontSizeMultiplier !== 1
		? `${quotesSettings.fontSizeMultiplier}em`
		: ''}"
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
			<p class="quote-author text-foreground-secondary">
				— {quote.author}
				{#if authorBioText}
					<button
						onclick={() => (showBio = !showBio)}
						class="inline-flex ml-1 text-foreground-muted hover:text-primary transition-colors align-middle"
						aria-label="Info"
					>
						<Info size={16} />
					</button>
				{/if}
			</p>
			{#if showBio && authorBioText}
				<p class="text-sm text-foreground-muted mt-1 italic">{authorBioText}</p>
			{/if}
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
				class="p-2 rounded-full hover:bg-surface-hover transition-colors text-foreground-secondary"
				aria-label={$_('home.share')}
			>
				<ShareNetwork size={20} />
			</button>

			{#if authStore.isAuthenticated}
				<button
					onclick={toggleFavorite}
					class="p-2 rounded-full hover:bg-surface-hover transition-colors"
					aria-label={isFavorite ? $_('home.unfavorite') : $_('home.favorite')}
				>
					<Heart
						size={20}
						class="transition-colors {isFavorite
							? 'text-red-500 fill-red-500'
							: 'text-foreground-secondary'}"
					/>
				</button>
			{/if}
		</div>
	</div>
</div>
