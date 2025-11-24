<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'elevated' | 'outlined' | 'ghost';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg';

	interface Props {
		variant?: CardVariant;
		padding?: CardPadding;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'elevated',
		padding = 'md',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const variantClasses: Record<CardVariant, string> = {
		elevated: 'bg-menu shadow-md border border-theme',
		outlined: 'bg-content border border-theme',
		ghost: 'bg-transparent'
	};

	const paddingClasses: Record<CardPadding, string> = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const classes = $derived(
		`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`
	);
</script>

<div
	class={classes}
	{onclick}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
>
	{@render children()}
</div>
