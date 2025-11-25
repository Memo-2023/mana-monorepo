<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		padding?: boolean;
		children: Snippet;
	}

	let { class: className = '', padding = true, children }: Props = $props();

	const baseStyles = 'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900';
	const paddingStyles = padding ? 'p-6' : '';
	const cardClass = `${baseStyles} ${paddingStyles} ${className}`;
</script>

<div class={cardClass}>
	{@render children()}
</div>
