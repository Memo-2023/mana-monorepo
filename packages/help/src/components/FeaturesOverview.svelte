<script lang="ts">
	import type { FeaturesOverviewProps } from '../ui-types';
	import FeatureCard from './FeatureCard.svelte';

	let { items, translations }: FeaturesOverviewProps = $props();

	const groupedItems = $derived(() => {
		const groups: Record<string, typeof items> = {
			'getting-started': [],
			core: [],
			advanced: [],
			integration: [],
		};

		for (const item of items) {
			const category = item.category || 'core';
			if (groups[category]) {
				groups[category].push(item);
			} else {
				groups.core.push(item);
			}
		}

		return groups;
	});

	const hasItems = $derived(items.length > 0);
</script>

{#if !hasItems}
	<p class="py-8 text-center text-gray-500 dark:text-gray-400">
		{translations.features.noItems}
	</p>
{:else}
	<div class="space-y-8">
		{#each Object.entries(groupedItems()) as [_category, categoryItems]}
			{#if categoryItems.length > 0}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each categoryItems as item (item.id)}
						<FeatureCard
							{item}
							learnMoreLabel={translations.features.learnMore}
							comingSoonLabel={translations.features.comingSoon}
						/>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
{/if}
