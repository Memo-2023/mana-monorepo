<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { quotesStore } from '$lib/modules/quotes/stores/quotes.svelte';
	import { quotesSettings } from '$lib/modules/quotes/stores/settings.svelte';
	import { QuotesEvents } from '@mana/shared-utils/analytics';
	import QuoteCard from '$lib/modules/quotes/components/QuoteCard.svelte';
	import { ArrowsClockwise } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	let isRefreshing = $state(false);

	async function loadNewQuote() {
		isRefreshing = true;
		quotesStore.loadRandomQuote();
		QuotesEvents.randomQuoteLoaded();
		// Small delay for visual feedback
		await new Promise((r) => setTimeout(r, 300));
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>Quotes - {$_('home.dailyQuote')}</title>
</svelte:head>

<RoutePage appId="quotes">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-foreground mb-2">{$_('home.dailyQuote')}</h1>
			<p class="text-foreground-secondary">{$_('app.tagline')}</p>
		</div>

		<!-- Daily Quote Card -->
		{#if quotesStore.currentQuote}
			<div
				class="mb-8 transition-[transform,colors,box-shadow] duration-300 {isRefreshing
					? 'opacity-50 scale-95'
					: ''}"
			>
				<QuoteCard
					quote={quotesStore.currentQuote}
					size="large"
					showCategory={quotesSettings.showCategory}
					showSource={quotesSettings.showSource}
				/>
			</div>
		{/if}

		<!-- New Quote Button -->
		<div class="text-center">
			<button
				onclick={loadNewQuote}
				disabled={isRefreshing}
				class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
			>
				<ArrowsClockwise size={20} class={isRefreshing ? 'animate-spin' : ''} />
				{$_('home.newQuote')}
			</button>
		</div>

		<!-- Quote Stats -->
		<div class="mt-12 text-center">
			<p class="text-sm text-foreground-muted">
				{quotesStore.totalCount} Zitate in 10 Kategorien
			</p>
		</div>
	</div>
</RoutePage>
