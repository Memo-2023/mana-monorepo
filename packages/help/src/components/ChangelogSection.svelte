<script lang="ts">
	import type { ChangelogSectionProps } from '../ui-types';
	import ChangelogEntry from './ChangelogEntry.svelte';

	let { items, translations, maxItems = 10 }: ChangelogSectionProps = $props();

	let showAll = $state(false);

	const sortedItems = $derived(() => {
		return [...items].sort(
			(a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
		);
	});

	const displayedItems = $derived(() => {
		if (showAll) return sortedItems();
		return sortedItems().slice(0, maxItems);
	});

	const hasMore = $derived(items.length > maxItems && !showAll);
</script>

{#if items.length === 0}
	<p class="py-8 text-center text-gray-500 dark:text-gray-400">
		{translations.changelog.noItems}
	</p>
{:else}
	<div>
		{#each displayedItems() as item (item.id)}
			<ChangelogEntry {item} {translations} />
		{/each}

		{#if hasMore}
			<div class="pt-4 text-center">
				<button
					type="button"
					class="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
					onclick={() => (showAll = true)}
				>
					{translations.changelog.showAll} ({items.length - maxItems})
				</button>
			</div>
		{/if}
	</div>
{/if}
