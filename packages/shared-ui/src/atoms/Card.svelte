<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'elevated' | 'outlined' | 'ghost' | 'filled';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg';

	interface Props {
		/** Visual variant of the card */
		variant?: CardVariant;
		/** Padding size */
		padding?: CardPadding;
		/** Make card interactive (adds hover effects) */
		interactive?: boolean;
		/** Makes card take full width */
		fullWidth?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Click handler */
		onclick?: (e: MouseEvent) => void;
		/** Header slot */
		header?: Snippet;
		/** Footer slot */
		footer?: Snippet;
		/** Main content */
		children: Snippet;
	}

	let {
		variant = 'elevated',
		padding = 'md',
		interactive = false,
		fullWidth = false,
		class: className = '',
		onclick,
		header,
		footer,
		children,
	}: Props = $props();

	// Determine if card should be interactive
	const isInteractive = $derived(interactive || !!onclick);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="card card--{variant} card--padding-{padding} {isInteractive
		? 'card--interactive'
		: ''} {fullWidth ? 'card--full-width' : ''} {className}"
	{onclick}
	role={isInteractive ? 'button' : undefined}
	tabindex={isInteractive ? 0 : undefined}
	onkeydown={(e) => {
		if (isInteractive && onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick(e as unknown as MouseEvent);
		}
	}}
>
	{#if header}
		<div class="card__header">
			{@render header()}
		</div>
	{/if}

	<div class="card__body">
		{@render children()}
	</div>

	{#if footer}
		<div class="card__footer">
			{@render footer()}
		</div>
	{/if}
</div>

<style>
	.card {
		border-radius: 0.75rem;
		overflow: hidden;
		transition: all 0.15s ease;
	}

	/* Variants */
	.card--elevated {
		background-color: hsl(var(--color-surface-elevated));
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 1px 3px 0 rgba(0, 0, 0, 0.1),
			0 1px 2px -1px rgba(0, 0, 0, 0.1);
	}

	.card--outlined {
		background-color: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
	}

	.card--ghost {
		background-color: transparent;
	}

	.card--filled {
		background-color: hsl(var(--color-muted));
	}

	/* Padding */
	.card--padding-none .card__body {
		padding: 0;
	}

	.card--padding-sm .card__body {
		padding: 0.75rem;
	}

	.card--padding-md .card__body {
		padding: 1rem;
	}

	.card--padding-lg .card__body {
		padding: 1.5rem;
	}

	/* Full width */
	.card--full-width {
		width: 100%;
	}

	/* Interactive */
	.card--interactive {
		cursor: pointer;
	}

	.card--interactive:hover {
		border-color: hsl(var(--color-border-strong));
	}

	.card--elevated.card--interactive:hover {
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -2px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.card--interactive:focus-visible {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 2px;
	}

	/* Header */
	.card__header {
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.card--padding-sm .card__header {
		padding: 0.75rem;
	}

	.card--padding-lg .card__header {
		padding: 1.25rem 1.5rem;
	}

	.card--padding-none .card__header {
		padding: 0;
		border-bottom: none;
	}

	/* Body - padding applied via variant classes above */

	/* Footer */
	.card__footer {
		padding: 1rem;
		border-top: 1px solid hsl(var(--color-border));
		background-color: hsl(var(--color-muted) / 0.3);
	}

	.card--padding-sm .card__footer {
		padding: 0.75rem;
	}

	.card--padding-lg .card__footer {
		padding: 1.25rem 1.5rem;
	}

	.card--padding-none .card__footer {
		padding: 0;
		border-top: none;
		background-color: transparent;
	}
</style>
