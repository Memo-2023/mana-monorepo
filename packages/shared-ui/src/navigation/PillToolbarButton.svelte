<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Click handler */
		onclick: () => void;
		/** Whether the button is in active state */
		active?: boolean;
		/** Tooltip title */
		title?: string;
		/** Whether to render as icon-only (smaller padding) */
		iconOnly?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Button content (icon and/or text) */
		children: Snippet;
	}

	let {
		onclick,
		active = false,
		title,
		iconOnly = false,
		disabled = false,
		children,
	}: Props = $props();
</script>

<button
	type="button"
	class="toolbar-btn"
	class:active
	class:icon-only={iconOnly}
	{title}
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style>
	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: hsl(var(--color-foreground) / 0.05);
	}

	.toolbar-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.toolbar-btn.icon-only {
		padding: 0.5rem;
	}

	.toolbar-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Icon styling */
	.toolbar-btn :global(svg) {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}
</style>
