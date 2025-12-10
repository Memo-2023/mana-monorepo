<script lang="ts">
	import type { FAQItem } from '@manacore/shared-help-types';

	interface Props {
		item: FAQItem;
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { item, expanded = false, onToggle }: Props = $props();

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle?.();
		}
	}
</script>

<div class="border-b border-gray-200 dark:border-gray-700">
	<button
		type="button"
		class="flex w-full items-center justify-between py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
		aria-expanded={expanded}
		onclick={onToggle}
		onkeydown={handleKeyDown}
	>
		<span class="pr-4 font-medium text-gray-900 dark:text-gray-100">
			{item.question}
		</span>
		<span
			class="flex-shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400"
			class:rotate-180={expanded}
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</span>
	</button>

	{#if expanded}
		<div class="prose prose-sm dark:prose-invert max-w-none pb-4 text-gray-600 dark:text-gray-300">
			{@html item.answer}
		</div>
	{/if}
</div>
