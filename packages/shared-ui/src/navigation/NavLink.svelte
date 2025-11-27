<script lang="ts">
	import type { NavLinkProps } from './types';

	let {
		item,
		active = false,
		variant = 'default',
		minimized = false,
		class: className = '',
	}: NavLinkProps = $props();

	let showTooltip = $state(false);

	function handleMouseEnter() {
		if (minimized) {
			showTooltip = true;
		}
	}

	function handleMouseLeave() {
		showTooltip = false;
	}
</script>

<a
	href={item.href}
	class="nav-link nav-link--{variant} {active ? 'nav-link--active' : ''} {minimized
		? 'nav-link--minimized'
		: ''} {className}"
	class:nav-link--disabled={item.disabled}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	aria-current={active ? 'page' : undefined}
	aria-disabled={item.disabled}
>
	{#if item.icon}
		<span class="nav-link__icon">
			{#if item.icon.startsWith('<svg') || item.icon.startsWith('M')}
				<!-- SVG path or element -->
				{@html item.icon.startsWith('M')
					? `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${item.icon}"/></svg>`
					: item.icon}
			{:else}
				<!-- Emoji or text icon -->
				<span class="text-lg">{item.icon}</span>
			{/if}
		</span>
	{/if}

	{#if !minimized}
		<span class="nav-link__label">{item.label}</span>
	{/if}

	{#if item.badge !== undefined && !minimized}
		<span class="nav-link__badge">{item.badge}</span>
	{/if}

	{#if item.shortcut && !minimized}
		<kbd class="nav-link__shortcut">{item.shortcut}</kbd>
	{/if}

	{#if minimized && showTooltip}
		<span class="nav-link__tooltip">{item.label}</span>
	{/if}
</a>

<style>
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
		position: relative;
	}

	.nav-link:hover:not(.nav-link--disabled) {
		background-color: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}

	.nav-link--active {
		background-color: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.nav-link--active:hover {
		background-color: hsl(var(--color-primary) / 0.15);
	}

	.nav-link--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Sidebar variant */
	.nav-link--sidebar {
		padding: 0.75rem;
		border-radius: 0.5rem;
	}

	/* Mobile variant */
	.nav-link--mobile {
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		font-size: 0.75rem;
	}

	/* Pill variant */
	.nav-link--pill {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background-color: hsl(var(--color-surface));
	}

	.nav-link--pill:hover:not(.nav-link--disabled) {
		background-color: hsl(var(--color-surface-hover));
	}

	.nav-link--pill.nav-link--active {
		background-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* Minimized sidebar */
	.nav-link--minimized {
		justify-content: center;
		padding: 0.75rem;
	}

	/* Icon */
	.nav-link__icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
	}

	.nav-link__icon :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Label */
	.nav-link__label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Badge */
	.nav-link__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		font-size: 0.625rem;
		font-weight: 600;
		background-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-radius: 9999px;
	}

	/* Shortcut */
	.nav-link__shortcut {
		font-family: ui-monospace, monospace;
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background-color: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Tooltip */
	.nav-link__tooltip {
		position: fixed;
		left: calc(100% + 0.75rem);
		top: 50%;
		transform: translateY(-50%);
		padding: 0.5rem 0.75rem;
		background-color: hsl(var(--color-foreground));
		color: hsl(var(--color-background));
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.375rem;
		white-space: nowrap;
		z-index: 50;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		pointer-events: none;
	}

	.nav-link__tooltip::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-right-color: hsl(var(--color-foreground));
	}
</style>
