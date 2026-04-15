<script lang="ts">
	import type { Snippet } from 'svelte';
	import { phosphorIcons } from './phosphor-icon-map';

	interface Props {
		/** Phosphor icon name (see phosphor-icon-map.ts). */
		icon?: string;
		/** URL to navigate to. If set, renders an <a>; otherwise a <button>. */
		href?: string;
		/** Display label. Use `iconOnly` to hide. */
		label?: string;
		/** Hide label (label is still used for aria-label/title). */
		iconOnly?: boolean;
		/** Height preset. 'sm' = 36px (PillNav), 'md' = 44px (bar pills). */
		size?: 'sm' | 'md';
		/** Active/selected state */
		active?: boolean;
		/** Primary accent (e.g. "Erstellen") */
		primary?: boolean;
		/** Destructive style (e.g. Logout) */
		danger?: boolean;
		/** Disabled state (button only) */
		disabled?: boolean;
		/** Click handler */
		onclick?: (e: MouseEvent) => void;
		/** Right-click handler */
		oncontextmenu?: (e: MouseEvent) => void;
		/** Tooltip */
		title?: string;
		/** Extra class names (e.g. drag-source marker) */
		class?: string;
		/** Bind the rendered <button>/<a> element for programmatic focus/click. */
		element?: HTMLButtonElement | HTMLAnchorElement | null;
		/** Arbitrary data-* attributes to forward (e.g. {'data-menu-trigger': ''}). */
		data?: Record<string, string>;
		/** Custom content rendered before the label (e.g. colored tag dot). */
		leading?: Snippet;
		/** Custom content rendered after the label. */
		trailing?: Snippet;
	}

	let {
		icon,
		href,
		label,
		iconOnly = false,
		size = 'md',
		active = false,
		primary = false,
		danger = false,
		disabled = false,
		onclick,
		oncontextmenu,
		title,
		class: className,
		element = $bindable(null),
		data,
		leading,
		trailing,
	}: Props = $props();

	const IconComp = $derived(icon ? phosphorIcons[icon] : null);
	const iconPx = $derived(size === 'sm' ? 18 : 20);
	const ariaLabel = $derived(iconOnly ? label : undefined);
	const effectiveTitle = $derived(title ?? (iconOnly ? label : undefined));
</script>

{#snippet body()}
	{#if leading}{@render leading()}{/if}
	{#if IconComp}
		<IconComp size={iconPx} weight="bold" class="pill-icon" />
	{/if}
	{#if label && !iconOnly}
		<span class="pill-label">{label}</span>
	{/if}
	{#if trailing}{@render trailing()}{/if}
{/snippet}

{#if href}
	<a
		bind:this={element as HTMLAnchorElement}
		{href}
		class={[
			'pill',
			`pill-${size}`,
			iconOnly && 'icon-only',
			active && 'active',
			primary && 'primary',
			danger && 'danger',
			className,
		]
			.filter(Boolean)
			.join(' ')}
		aria-label={ariaLabel}
		title={effectiveTitle}
		{onclick}
		{oncontextmenu}
		{...data}
	>
		{@render body()}
	</a>
{:else}
	<button
		bind:this={element as HTMLButtonElement}
		type="button"
		class={[
			'pill',
			`pill-${size}`,
			iconOnly && 'icon-only',
			active && 'active',
			primary && 'primary',
			danger && 'danger',
			className,
		]
			.filter(Boolean)
			.join(' ')}
		aria-label={ariaLabel}
		title={effectiveTitle}
		{disabled}
		{onclick}
		{oncontextmenu}
		{...data}
	>
		{@render body()}
	</button>
{/if}

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
	}

	.pill-md {
		height: 44px;
	}

	.pill-sm {
		height: 36px;
	}

	/* Icon-only pill: wider than tall so it reads as a pill, not a chip. */
	.pill.icon-only {
		gap: 0;
		padding: 0 1.125rem;
	}

	.pill:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-card)));
		border-color: hsl(var(--color-border-strong, var(--color-border)));
	}

	.pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			white 80%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #f8d62b));
	}

	.pill.primary {
		background: var(--pill-primary-color, var(--color-primary-500, #6366f1));
		border-color: transparent;
		color: white;
	}

	.pill.danger {
		color: #dc2626;
	}

	:global(.dark) .pill.danger {
		color: #ef4444;
	}

	.pill :global(.pill-label) {
		font-weight: 500;
	}
</style>
