<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'elevated' | 'outlined' | 'ghost';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children: Snippet;
		class?: string;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'elevated',
		padding = 'md',
		children,
		class: className = '',
		onclick
	}: Props = $props();

	const variantClasses = {
		elevated: 'bg-surface-elevated shadow-md',
		outlined: 'bg-surface border border-border',
		ghost: 'bg-transparent'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const classes = `rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
</script>

<div class={classes} {onclick} role={onclick ? 'button' : undefined} tabindex={onclick ? 0 : undefined}>
	{@render children()}
</div>
