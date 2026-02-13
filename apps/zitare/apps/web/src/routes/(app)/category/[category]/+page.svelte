<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getQuotesByCategory, CATEGORIES, type Category } from '@zitare/content';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	// Get category from URL
	let category = $derived($page.params.category as Category);

	// Validate category
	let isValidCategory = $derived(CATEGORIES.includes(category));

	// Get quotes for this category
	let quotes = $derived(isValidCategory ? getQuotesByCategory(category) : []);

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
</script>

<svelte:head>
	<title>Zitare - {isValidCategory ? $_(categoryLabels[category]) : 'Kategorie'}</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<!-- Back button -->
	<button
		onclick={() => goto('/categories')}
		class="flex items-center gap-2 text-foreground-secondary hover:text-foreground mb-6 transition-colors"
	>
		<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		{$_('categories.title')}
	</button>

	{#if isValidCategory}
		<h1 class="text-3xl font-bold text-foreground mb-2">{$_(categoryLabels[category])}</h1>
		<p class="text-foreground-secondary mb-8">
			{$_('categories.quotes', { values: { count: quotes.length } })}
		</p>

		<div class="space-y-6">
			{#each quotes as quote (quote.id)}
				<QuoteCard {quote} showSource />
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-foreground-secondary">Kategorie nicht gefunden</p>
			<button onclick={() => goto('/categories')} class="mt-4 text-primary hover:underline">
				Zurück zu Kategorien
			</button>
		</div>
	{/if}
</div>
