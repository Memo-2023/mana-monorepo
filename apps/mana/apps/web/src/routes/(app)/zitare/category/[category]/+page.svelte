<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getQuotesByCategory, CATEGORIES, type Category, type Quote } from '@zitare/content';
	import { quotesStore } from '$lib/modules/zitare/stores/quotes.svelte';
	import { zitareSettings } from '$lib/modules/zitare/stores/settings.svelte';
	import QuoteCard from '$lib/modules/zitare/components/QuoteCard.svelte';
	import { CaretLeft, MagnifyingGlass } from '@mana/shared-icons';

	// Get category from URL
	let category = $derived($page.params.category as Category);

	// Validate category
	let isValidCategory = $derived(CATEGORIES.includes(category));

	// Get quotes for this category
	let quotes = $derived(isValidCategory ? getQuotesByCategory(category) : []);

	// Search & sort state
	let searchTerm = $state('');
	let sortBy = $state<'default' | 'author'>('default');

	// Filtered and sorted quotes — `$derived.by` is the variant that
	// takes a thunk; plain `$derived(expr)` only takes a single
	// expression.
	let displayedQuotes = $derived.by<Quote[]>(() => {
		let filtered = quotes;

		// Filter by search
		if (searchTerm.length >= 2) {
			const lower = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(q) =>
					quotesStore.getText(q).toLowerCase().includes(lower) ||
					q.author.toLowerCase().includes(lower)
			);
		}

		// Sort
		if (sortBy === 'author') {
			return [...filtered].sort((a, b) => a.author.localeCompare(b.author));
		}
		return filtered;
	});

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
	<title
		>Zitare - {isValidCategory ? $_(categoryLabels[category]) : $_('categories.notFound')}</title
	>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<!-- Back button -->
	<button
		onclick={() => goto('/zitare/categories')}
		class="flex items-center gap-2 text-foreground-secondary hover:text-foreground mb-6 transition-colors"
	>
		<CaretLeft size={20} />
		{$_('categories.title')}
	</button>

	{#if isValidCategory}
		<h1 class="text-3xl font-bold text-foreground mb-2">{$_(categoryLabels[category])}</h1>
		<p class="text-foreground-secondary mb-6">
			{$_('categories.quotes', { values: { count: quotes.length } })}
		</p>

		<!-- Search & Sort Bar -->
		<div class="flex gap-3 mb-8">
			<div class="relative flex-1">
				<div class="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
					<MagnifyingGlass size={16} />
				</div>
				<input
					type="text"
					placeholder={$_('categories.searchInCategory')}
					bind:value={searchTerm}
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
				/>
			</div>
			<select
				bind:value={sortBy}
				class="px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground text-sm"
			>
				<option value="default">{$_('categories.sortByDefault')}</option>
				<option value="author">{$_('categories.sortByAuthor')}</option>
			</select>
		</div>

		{#if displayedQuotes.length === 0 && searchTerm.length >= 2}
			<div class="text-center py-12">
				<p class="text-foreground-secondary">{$_('search.noResults')}</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each displayedQuotes as quote (quote.id)}
					<QuoteCard {quote} showSource={zitareSettings.showSource} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="text-center py-12">
			<p class="text-foreground-secondary">{$_('categories.notFound')}</p>
			<button onclick={() => goto('/zitare/categories')} class="mt-4 text-primary hover:underline">
				{$_('categories.backToCategories')}
			</button>
		</div>
	{/if}
</div>
