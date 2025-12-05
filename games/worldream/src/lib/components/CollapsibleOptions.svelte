<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		title?: string;
		initiallyOpen?: boolean;
		hasContent?: boolean;
		children?: any;
	}

	let {
		title = 'Weitere Optionen',
		initiallyOpen = false,
		hasContent = false,
		children,
	}: Props = $props();

	// Automatically open if there's content or manually requested
	let isOpen = $state(initiallyOpen || hasContent);

	// Update isOpen when hasContent changes
	$effect(() => {
		if (hasContent && !isOpen) {
			isOpen = true;
		}
	});

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="border-t pt-6">
	<button
		type="button"
		onclick={toggle}
		class="-m-2 flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-theme-interactive-hover focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2"
	>
		<h2 class="text-lg font-medium text-theme-text-primary">{title}</h2>
		<svg
			class="h-5 w-5 text-theme-text-secondary transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div transition:slide={{ duration: 200 }} class="mt-4 space-y-4">
			{@render children?.()}
		</div>
	{/if}
</div>
