<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger';
		loading?: boolean;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		loading = false,
		disabled,
		children,
		class: className,
		...rest
	}: Props = $props();

	const variantClasses: Record<string, string> = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
		secondary:
			'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
	};
</script>

<button
	class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed {variantClasses[
		variant
	]} {className ?? ''}"
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<div
			class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
		></div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
