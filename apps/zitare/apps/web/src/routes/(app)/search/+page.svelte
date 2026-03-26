<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { searchQuotes, type Quote } from '@zitare/content';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	let searchTerm = $state('');
	let lastTrackedTerm = $state('');

	// Search results
	let results = $derived<Quote[]>(
		searchTerm.length >= 2 ? searchQuotes(searchTerm, quotesStore.language) : []
	);

	// Track search when results change (debounced by derived reactivity)
	$effect(() => {
		if (searchTerm.length >= 2 && searchTerm !== lastTrackedTerm) {
			lastTrackedTerm = searchTerm;
			ZitareEvents.searchPerformed(results.length);
		}
	});
</script>

<svelte:head>
	<title>Zitare - {$_('search.title')}</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold text-foreground mb-6">{$_('search.title')}</h1>

	<!-- Search Input -->
	<div class="relative mb-8">
		<svg
			class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			placeholder={$_('search.placeholder')}
			bind:value={searchTerm}
			class="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-elevated border border-border text-foreground text-lg focus:outline-none focus:border-primary transition-colors"
		/>
		{#if searchTerm}
			<button
				onclick={() => (searchTerm = '')}
				class="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Results -->
	{#if searchTerm.length >= 2}
		{#if results.length === 0}
			<div class="text-center py-12">
				<svg
					class="w-16 h-16 mx-auto text-foreground-muted mb-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<circle cx="11" cy="11" r="8" stroke-width="1.5"></circle>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="m21 21-4.35-4.35"
					></path>
				</svg>
				<p class="text-foreground-secondary">{$_('search.noResults')}</p>
			</div>
		{:else}
			<p class="text-foreground-secondary mb-6">
				{$_('search.results', { values: { count: results.length } })}
			</p>
			<div class="space-y-6">
				{#each results as quote (quote.id)}
					<QuoteCard {quote} showCategory showSource />
				{/each}
			</div>
		{/if}
	{:else if searchTerm.length > 0}
		<p class="text-center text-foreground-muted py-8">{$_('search.minChars')}</p>
	{:else}
		<div class="text-center py-12">
			<svg
				class="w-16 h-16 mx-auto text-foreground-muted mb-4 opacity-50"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<circle cx="11" cy="11" r="8" stroke-width="1.5"></circle>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m21 21-4.35-4.35"
				></path>
			</svg>
			<p class="text-foreground-secondary">{$_('search.hint')}</p>
		</div>
	{/if}
</div>
