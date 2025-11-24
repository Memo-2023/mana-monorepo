<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
	type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		type?: 'button' | 'submit' | 'reset';
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		class: className = '',
		onclick,
		type = 'button',
		children
	}: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'bg-primary text-white hover:bg-primary/90 border-transparent',
		secondary: 'bg-menu text-theme hover:bg-menu-hover border-theme',
		ghost: 'bg-transparent text-theme hover:bg-menu-hover border-transparent',
		danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
		outline: 'bg-transparent text-primary border-primary hover:bg-primary/10',
		success: 'bg-green-600 text-white hover:bg-green-700 border-transparent'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
		xl: 'px-8 py-4 text-xl'
	};

	const classes = $derived(
		`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
	);
</script>

<button
	{type}
	class={classes}
	disabled={disabled || loading}
	{onclick}
>
	{#if loading}
		<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
		</svg>
	{/if}
	{@render children?.()}
</button>
