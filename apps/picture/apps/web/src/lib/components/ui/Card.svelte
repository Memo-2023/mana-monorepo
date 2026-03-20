<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class="rounded-lg border border-gray-200 bg-white shadow-sm {className ?? ''}">
	{#if children}
		{@render children()}
	{/if}
</div>
