<script lang="ts">
	import { marked } from 'marked';
	import type { Memory } from '$lib/types/memo.types';

	interface Props {
		memory: Memory;
		defaultExpanded?: boolean;
	}

	let { memory, defaultExpanded = true }: Props = $props();

	let isExpanded = $state(defaultExpanded);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	// Parse markdown content to HTML
	const renderedContent = $derived(
		marked.parse(memory.content || '', { async: false, breaks: true }) as string
	);
</script>

<div class="memory-container">
	<!-- Header (clickable) -->
	<button
		onclick={toggleExpanded}
		class="memory-header group w-full text-left flex items-center gap-2 py-3 transition-colors hover:opacity-70"
	>
		<!-- Bullet Point -->
		<span class="text-theme transition-opacity" class:opacity-50={isExpanded}>•</span>

		<!-- Title -->
		<h4 class="flex-1 font-semibold text-theme transition-opacity" class:opacity-50={isExpanded}>
			{memory.title}
		</h4>

		<!-- Chevron Icon -->
		<svg
			class="h-4 w-4 text-theme opacity-50 transition-transform"
			class:rotate-0={isExpanded}
			class:rotate-90={!isExpanded}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Content (collapsible) -->
	{#if isExpanded}
		<div class="memory-content pb-3">
			<div class="prose max-w-none dark:prose-invert text-base text-theme leading-relaxed">
				{@html renderedContent}
			</div>
		</div>
	{/if}
</div>

<style>
	.memory-container {
		background-color: transparent;
		width: 100%;
	}

	.memory-header {
		background-color: transparent;
		border: none;
		cursor: pointer;
	}

	.memory-content {
		background-color: transparent;
	}

	/* Smooth rotation animation */
	svg {
		transition: transform 0.2s ease-in-out;
	}

	.rotate-0 {
		transform: rotate(0deg);
	}

	.rotate-90 {
		transform: rotate(90deg);
	}
</style>
