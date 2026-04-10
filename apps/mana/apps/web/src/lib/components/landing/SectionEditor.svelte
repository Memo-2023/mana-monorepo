<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CaretDown } from '@mana/shared-icons';

	let {
		title,
		expanded = false,
		children,
	}: { title: string; expanded?: boolean; children: Snippet } = $props();

	// svelte-ignore state_referenced_locally
	let isExpanded = $state(expanded);
</script>

<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
	<button
		type="button"
		onclick={() => (isExpanded = !isExpanded)}
		class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
	>
		<span class="font-medium text-sm text-gray-900 dark:text-white">{title}</span>
		<CaretDown
			size={20}
			class="text-gray-500 transition-transform {isExpanded ? 'rotate-180' : ''}"
		/>
	</button>

	{#if isExpanded}
		<div class="px-4 py-4 space-y-4">
			{@render children()}
		</div>
	{/if}
</div>
