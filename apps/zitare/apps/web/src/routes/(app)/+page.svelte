<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	let isRefreshing = $state(false);

	async function loadNewQuote() {
		isRefreshing = true;
		quotesStore.loadRandomQuote();
		ZitareEvents.randomQuoteLoaded();
		// Small delay for visual feedback
		await new Promise((r) => setTimeout(r, 300));
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>Zitare - {$_('home.dailyQuote')}</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Header -->
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-foreground mb-2">{$_('home.dailyQuote')}</h1>
		<p class="text-foreground-secondary">{$_('app.tagline')}</p>
	</div>

	<!-- Daily Quote Card -->
	{#if quotesStore.currentQuote}
		<div class="mb-8 transition-all duration-300 {isRefreshing ? 'opacity-50 scale-95' : ''}">
			<QuoteCard quote={quotesStore.currentQuote} size="large" showCategory showSource />
		</div>
	{/if}

	<!-- New Quote Button -->
	<div class="text-center">
		<button
			onclick={loadNewQuote}
			disabled={isRefreshing}
			class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
		>
			<svg
				class="w-5 h-5 {isRefreshing ? 'animate-spin' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
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
