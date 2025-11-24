<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type BadgeSize = 'sm' | 'md';

	interface Props {
		variant?: BadgeVariant;
		size?: BadgeSize;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		size = 'md',
		class: className = '',
		children
	}: Props = $props();

	const variantClasses: Record<BadgeVariant, string> = {
		default: 'bg-menu text-theme border-theme',
		primary: 'bg-primary/20 text-primary border-primary/30',
		success: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
		warning: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
		danger: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
		info: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
	};

	const sizeClasses: Record<BadgeSize, string> = {
		sm: 'px-1.5 py-0.5 text-xs',
		md: 'px-2 py-1 text-sm'
	};

	const classes = $derived(
		`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
	);
</script>

<span class={classes}>
	{@render children?.()}
</span>
