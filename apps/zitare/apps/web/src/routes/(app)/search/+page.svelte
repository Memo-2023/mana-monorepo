<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { searchQuotes, getAllCategories, type Quote, type Category } from '@zitare/content';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { zitareSettings } from '$lib/stores/settings.svelte';
	import QuoteCard from '$lib/components/QuoteCard.svelte';
	import { MagnifyingGlass, X } from '@manacore/shared-icons';

	let searchTerm = $state('');
	let lastTrackedTerm = $state('');
	let selectedCategory = $state<Category | null>(null);

	const categories = getAllCategories();

	// Category i18n key mapping
	const categoryKeys: Record<Category, string> = {
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

	// Search results with optional category filter
	let results = $derived<Quote[]>(() => {
		if (searchTerm.length < 2) return [];
		const searchResults = searchQuotes(searchTerm, quotesStore.language);
		if (!selectedCategory) return searchResults;
		return searchResults.filter((q) => q.category === selectedCategory);
	});

	// Track search when results change
	$effect(() => {
		if (searchTerm.length >= 2 && searchTerm !== lastTrackedTerm) {
			lastTrackedTerm = searchTerm;
			ZitareEvents.searchPerformed(results.length);
		}
	});

	function toggleCategory(cat: Category) {
		selectedCategory = selectedCategory === cat ? null : cat;
	}

	function clearSearch() {
		searchTerm = '';
		selectedCategory = null;
	}
</script>

<svelte:head>
	<title>Zitare - {$_('search.title')}</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold text-foreground mb-6">{$_('search.title')}</h1>

	<!-- Search Input -->
	<div class="relative mb-4">
		<div class="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
			<MagnifyingGlass size={20} />
		</div>
		<input
			type="text"
			placeholder={$_('search.placeholder')}
			bind:value={searchTerm}
			class="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-elevated border border-border text-foreground text-lg focus:outline-none focus:border-primary transition-colors"
		/>
		{#if searchTerm}
			<button
				onclick={clearSearch}
				class="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors"
			>
				<X size={20} />
			</button>
		{/if}
	</div>

	<!-- Category Filter Chips -->
	{#if searchTerm.length >= 2 && results.length > 0}
		<div class="flex flex-wrap gap-2 mb-6">
			<button
				onclick={() => (selectedCategory = null)}
				class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {selectedCategory ===
				null
					? 'bg-primary text-white'
					: 'bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border'}"
			>
				{$_('search.allCategories')}
			</button>
			{#each categories as cat}
				{@const matchCount = searchQuotes(searchTerm, quotesStore.language).filter(
					(q) => q.category === cat.name
				).length}
				{#if matchCount > 0}
					<button
						onclick={() => toggleCategory(cat.name)}
						class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {selectedCategory ===
						cat.name
							? 'bg-primary text-white'
							: 'bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border'}"
					>
						{$_(categoryKeys[cat.name])}
						<span class="ml-1 opacity-70">{matchCount}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Results -->
	{#if searchTerm.length >= 2}
		{#if results.length === 0}
			<div class="text-center py-12">
				<div class="w-16 h-16 mx-auto text-foreground-muted mb-4 flex items-center justify-center">
					<MagnifyingGlass size={64} />
				</div>
				<p class="text-foreground-secondary">{$_('search.noResults')}</p>
			</div>
		{:else}
			<p class="text-foreground-secondary mb-6">
				{$_('search.results', { values: { count: results.length } })}
			</p>
			<div class="space-y-6">
				{#each results as quote (quote.id)}
					<QuoteCard
						{quote}
						showCategory={zitareSettings.showCategory}
						showSource={zitareSettings.showSource}
					/>
				{/each}
			</div>
		{/if}
	{:else if searchTerm.length > 0}
		<p class="text-center text-foreground-muted py-8">{$_('search.minChars')}</p>
	{:else}
		<div class="text-center py-12">
			<div
				class="w-16 h-16 mx-auto text-foreground-muted mb-4 opacity-50 flex items-center justify-center"
			>
				<MagnifyingGlass size={64} />
			</div>
			<p class="text-foreground-secondary">{$_('search.hint')}</p>
		</div>
	{/if}
</div>
