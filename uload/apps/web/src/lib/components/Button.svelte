<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	
	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';
	
	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		fullWidth?: boolean;
	}
	
	let { 
		variant = 'secondary',
		size = 'md',
		fullWidth = false,
		class: className = '',
		children,
		...restProps
	}: Props = $props();
	
	const variantClasses = {
		primary: 'bg-purple-600 text-white hover:bg-purple-700',
		secondary: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover',
		ghost: 'bg-transparent text-theme-text hover:bg-theme-surface',
		danger: 'bg-red-600 text-white hover:bg-red-700'
	};
	
	const sizeClasses = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-3 py-1 text-sm',
		lg: 'px-4 py-2 text-base'
	};
	
	const classes = $derived(`
		${variantClasses[variant]}
		${sizeClasses[size]}
		${fullWidth ? 'w-full' : ''}
		rounded-lg transition-colors
		${className}
	`.trim());
</script>

<button
	class={classes}
	{...restProps}
>
	{@render children()}
</button>