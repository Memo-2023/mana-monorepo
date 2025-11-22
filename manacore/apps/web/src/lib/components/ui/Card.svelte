<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 {className}">
	{@render children()}
</div>
