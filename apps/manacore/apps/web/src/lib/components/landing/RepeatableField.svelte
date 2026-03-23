<script lang="ts" generics="T">
	import { Button } from '@manacore/shared-ui';
	import type { Snippet } from 'svelte';

	let {
		items = [],
		onAdd,
		onRemove,
		addLabel = 'Add',
		renderItem,
	}: {
		items: T[];
		onAdd: () => void;
		onRemove: (index: number) => void;
		addLabel?: string;
		renderItem: Snippet<[T, number]>;
	} = $props();
</script>

<div class="space-y-3">
	{#each items as item, index}
		<div class="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
			<button
				type="button"
				onclick={() => onRemove(index)}
				class="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
				title="Remove"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			{@render renderItem(item, index)}
		</div>
	{/each}

	<button
		type="button"
		onclick={onAdd}
		class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		{addLabel}
	</button>
</div>
