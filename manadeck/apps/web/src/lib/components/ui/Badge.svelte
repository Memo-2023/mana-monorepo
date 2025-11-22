<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'secondary' | 'outline' | 'destructive';
		children: Snippet;
		class?: string;
	}

	let {
		variant = 'default',
		children,
		class: className = ''
	}: Props = $props();

	const variantClasses = {
		default: 'bg-primary text-primary-foreground',
		secondary: 'bg-secondary text-secondary-foreground',
		outline: 'border border-border',
		destructive: 'bg-destructive text-destructive-foreground'
	};

	const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className}`;
</script>

<span class={classes}>
	{@render children()}
</span>
