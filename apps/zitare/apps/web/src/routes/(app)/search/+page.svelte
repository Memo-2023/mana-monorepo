<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { searchQuotes, getAllCategories, type Quote, type Category } from '@zitare/content';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { zitareSettings } from '$lib/stores/settings.svelte';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

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
				onclick={clearSearch}
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
