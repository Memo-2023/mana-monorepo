<script lang="ts">
	import type { FAQItem, FAQCategory } from '@manacore/shared-help-types';
	import type { FAQSectionProps } from '../types.js';
	import FAQItemComponent from './FAQItem.svelte';

	let {
		items,
		translations,
		showCategories = true,
		maxItems,
		expandFirst = false,
	}: FAQSectionProps = $props();

	let expandedId = $state<string | null>(expandFirst && items.length > 0 ? items[0].id : null);
	let selectedCategory = $state<FAQCategory | 'all'>('all');
	let showAll = $state(false);

	const categories: FAQCategory[] = [
		'general',
		'account',
		'billing',
		'features',
		'technical',
		'privacy',
	];

	const filteredItems = $derived(() => {
		let result = items;
		if (selectedCategory !== 'all') {
			result = result.filter((item) => item.category === selectedCategory);
		}
		if (maxItems && !showAll) {
			result = result.slice(0, maxItems);
		}
		return result;
	});

	const hasMore = $derived(maxItems ? items.length > maxItems && !showAll : false);

	function toggleItem(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	function getCategoryLabel(category: FAQCategory): string {
		return translations.faq.categories[category] ?? category;
	}
</script>

<div class="space-y-4">
	{#if showCategories && items.length > 0}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
				class:bg-primary-100={selectedCategory === 'all'}
				class:text-primary-700={selectedCategory === 'all'}
				class:dark:bg-primary-900={selectedCategory === 'all'}
				class:dark:text-primary-300={selectedCategory === 'all'}
				class:bg-gray-100={selectedCategory !== 'all'}
				class:text-gray-600={selectedCategory !== 'all'}
				class:dark:bg-gray-800={selectedCategory !== 'all'}
				class:dark:text-gray-400={selectedCategory !== 'all'}
				onclick={() => (selectedCategory = 'all')}
			>
				All
			</button>
			{#each categories as category}
				{@const hasItems = items.some((item) => item.category === category)}
				{#if hasItems}
					<button
						type="button"
						class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
						class:bg-primary-100={selectedCategory === category}
						class:text-primary-700={selectedCategory === category}
						class:dark:bg-primary-900={selectedCategory === category}
						class:dark:text-primary-300={selectedCategory === category}
						class:bg-gray-100={selectedCategory !== category}
						class:text-gray-600={selectedCategory !== category}
						class:dark:bg-gray-800={selectedCategory !== category}
						class:dark:text-gray-400={selectedCategory !== category}
						onclick={() => (selectedCategory = category)}
					>
						{getCategoryLabel(category)}
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	{#if filteredItems().length === 0}
		<p class="py-8 text-center text-gray-500 dark:text-gray-400">
			{translations.faq.noItems}
		</p>
	{:else}
		<div class="divide-y divide-gray-200 dark:divide-gray-700">
			{#each filteredItems() as item (item.id)}
				<FAQItemComponent
					{item}
					expanded={expandedId === item.id}
					onToggle={() => toggleItem(item.id)}
				/>
			{/each}
		</div>
	{/if}

	{#if hasMore}
		<div class="pt-4 text-center">
			<button
				type="button"
				class="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
				onclick={() => (showAll = true)}
			>
				{translations.common.showMore}
			</button>
		</div>
	{/if}
</div>
