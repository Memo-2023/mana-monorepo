<script lang="ts">
	import { selectedTags } from '$lib/stores/tags';
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { Check } from '@manacore/shared-icons';

	const allTags: { value: Tag[] } = getContext('tags');

	function toggleTag(tagId: string) {
		selectedTags.update((current) => {
			const newTags = current.includes(tagId)
				? current.filter((id) => id !== tagId)
				: [...current, tagId];

			return newTags;
		});
	}

	function isSelected(tagId: string): boolean {
		return $selectedTags.includes(tagId);
	}

	function getTagColor(color: string | null): string {
		if (!color) return 'bg-gray-200 dark:bg-gray-700';
		return `bg-${color}-200 dark:bg-${color}-800`;
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each allTags.value as tag (tag.id)}
		{@const selected = isSelected(tag.id)}
		<button
			onclick={() => toggleTag(tag.id)}
			class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all {selected
				? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 dark:bg-blue-500 dark:ring-blue-500'
				: 'bg-gray-100/80 text-gray-700 backdrop-blur-xl hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/80'}"
		>
			{#if tag.color}
				<span class="h-2 w-2 rounded-full" style="background-color: {tag.color};"></span>
			{/if}
			<span>{tag.name}</span>
			{#if selected}
				<Check size={14} weight="bold" />
			{/if}
		</button>
	{/each}

	{#if allTags.value.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Keine Tags vorhanden. Erstelle Tags in der Tag-Verwaltung.
		</p>
	{/if}
</div>
