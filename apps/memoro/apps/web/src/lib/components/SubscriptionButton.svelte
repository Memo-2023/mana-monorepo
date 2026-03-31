<script lang="ts">
	interface Props {
		label: string;
		onclick: () => void;
		iconName?: string;
		leftIconName?: string;
		variant?: 'primary' | 'secondary' | 'accent';
		disabled?: boolean;
	}

	let {
		label,
		onclick,
		iconName = 'arrow-forward-outline',
		leftIconName = 'cart-outline',
		variant = 'primary',
		disabled = false,
	}: Props = $props();

	// Icon mapping (simple SVG paths for common icons)
	const iconPaths: Record<string, string> = {
		'arrow-forward-outline': 'M5 12h14M12 5l7 7-7 7',
		'checkmark-circle-outline': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		'cart-outline':
			'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
	};
</script>

<button
	{disabled}
	onclick={disabled ? undefined : onclick}
	class="flex w-full h-12 items-center justify-between rounded-lg border px-4 font-medium transition-all duration-200"
	class:bg-mana={variant === 'accent' && !disabled}
	class:border-mana={variant === 'accent' && !disabled}
	class:text-white={variant === 'accent' && !disabled}
	class:bg-menu={variant === 'primary' && !disabled}
	class:border-theme={variant === 'primary' && !disabled}
	class:text-theme={variant === 'primary' && !disabled}
	class:bg-content={variant === 'secondary' && !disabled}
	class:hover:bg-menu-hover={!disabled}
	class:opacity-50={disabled}
	class:cursor-not-allowed={disabled}
>
	<div class="flex items-center justify-center">
		<svg
			class="mr-2 h-4 w-4"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d={iconPaths[leftIconName] || iconPaths['cart-outline']} />
		</svg>
		<span>{label}</span>
	</div>

	<svg
		class="ml-2 h-4 w-4"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d={iconPaths[iconName] || iconPaths['arrow-forward-outline']} />
	</svg>
</button>
