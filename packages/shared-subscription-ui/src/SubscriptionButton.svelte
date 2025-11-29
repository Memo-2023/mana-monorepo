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
	class="subscription-button"
	class:subscription-button--primary={variant === 'primary'}
	class:subscription-button--secondary={variant === 'secondary'}
	class:subscription-button--accent={variant === 'accent'}
	class:subscription-button--disabled={disabled}
>
	<div class="subscription-button__content">
		<svg
			class="subscription-button__icon subscription-button__icon--left"
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
		class="subscription-button__icon subscription-button__icon--right"
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

<style>
	.subscription-button {
		display: flex;
		width: 100%;
		height: 3rem;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.subscription-button--primary {
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: hsl(var(--foreground));
	}

	:global(.dark) .subscription-button--primary {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.subscription-button--primary:hover:not(.subscription-button--disabled) {
		background: rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .subscription-button--primary:hover:not(.subscription-button--disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.subscription-button--secondary {
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: hsl(var(--foreground));
	}

	:global(.dark) .subscription-button--secondary {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.subscription-button--secondary:hover:not(.subscription-button--disabled) {
		background: rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .subscription-button--secondary:hover:not(.subscription-button--disabled) {
		background: rgba(255, 255, 255, 0.12);
	}

	.subscription-button--accent {
		background: hsl(var(--primary, 221 83% 53%));
		border: 1px solid hsl(var(--primary, 221 83% 53%));
		color: white;
	}

	.subscription-button--accent:hover:not(.subscription-button--disabled) {
		filter: brightness(1.1);
	}

	.subscription-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.subscription-button__content {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.subscription-button__icon {
		width: 1rem;
		height: 1rem;
	}

	.subscription-button__icon--left {
		margin-right: 0.5rem;
	}

	.subscription-button__icon--right {
		margin-left: 0.5rem;
	}
</style>
