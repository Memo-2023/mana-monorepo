<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type TextVariant = 'body' | 'body-secondary' | 'small' | 'large' | 'muted';
	type TextAlign = 'left' | 'center' | 'right';
	type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

	interface Props extends HTMLAttributes<HTMLParagraphElement> {
		variant?: TextVariant;
		align?: TextAlign;
		weight?: TextWeight;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'body',
		align = 'left',
		weight = 'normal',
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const variantClasses: Record<TextVariant, string> = {
		body: 'text-base text-theme leading-relaxed',
		'body-secondary': 'text-base text-theme-secondary leading-relaxed',
		small: 'text-sm text-theme',
		large: 'text-lg text-theme leading-relaxed',
		muted: 'text-sm text-theme-muted'
	};

	const alignClasses: Record<TextAlign, string> = {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right'
	};

	const weightClasses: Record<TextWeight, string> = {
		normal: 'font-normal',
		medium: 'font-medium',
		semibold: 'font-semibold',
		bold: 'font-bold'
	};

	const classes = $derived(
		`${variantClasses[variant]} ${alignClasses[align]} ${weightClasses[weight]} ${className}`
	);
</script>

<p class={classes} {...restProps}>
	{@render children?.()}
</p>
