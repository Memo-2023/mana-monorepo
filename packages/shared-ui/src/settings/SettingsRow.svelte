<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Make the entire row clickable */
		href?: string;
		/** Click handler (alternative to href) */
		onclick?: () => void;
		/** Show border at bottom */
		border?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Control element (Toggle, Button, etc.) */
		children?: Snippet;
	}

	let {
		label,
		description,
		icon,
		href,
		onclick,
		border = true,
		disabled = false,
		class: className = '',
		children,
	}: Props = $props();

	const isClickable = $derived(!!href || !!onclick);
</script>

{#if href}
	<a
		{href}
		class="settings-row {border ? 'settings-row--border' : ''} settings-row--clickable {disabled
			? 'settings-row--disabled'
			: ''} {className}"
	>
		<div class="settings-row__content">
			{#if icon}
				<span class="settings-row__icon">
					{@render icon()}
				</span>
			{/if}
			<div class="settings-row__text">
				<span class="settings-row__label">{label}</span>
				{#if description}
					<span class="settings-row__description">{description}</span>
				{/if}
			</div>
		</div>
		<div class="settings-row__control">
			{#if children}
				{@render children()}
			{:else}
				<svg class="settings-row__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		</div>
	</a>
{:else if onclick}
	<button
		type="button"
		{onclick}
		class="settings-row {border ? 'settings-row--border' : ''} settings-row--clickable {disabled
			? 'settings-row--disabled'
			: ''} {className}"
		{disabled}
	>
		<div class="settings-row__content">
			{#if icon}
				<span class="settings-row__icon">
					{@render icon()}
				</span>
			{/if}
			<div class="settings-row__text">
				<span class="settings-row__label">{label}</span>
				{#if description}
					<span class="settings-row__description">{description}</span>
				{/if}
			</div>
		</div>
		<div class="settings-row__control">
			{#if children}
				{@render children()}
			{:else}
				<svg class="settings-row__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		</div>
	</button>
{:else}
	<div
		class="settings-row {border ? 'settings-row--border' : ''} {disabled
			? 'settings-row--disabled'
			: ''} {className}"
	>
		<div class="settings-row__content">
			{#if icon}
				<span class="settings-row__icon">
					{@render icon()}
				</span>
			{/if}
			<div class="settings-row__text">
				<span class="settings-row__label">{label}</span>
				{#if description}
					<span class="settings-row__description">{description}</span>
				{/if}
			</div>
		</div>
		{#if children}
			<div class="settings-row__control">
				{@render children()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.settings-row--border {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-row--border {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-row--border:last-child {
		border-bottom: none;
	}

	.settings-row--clickable {
		cursor: pointer;
	}

	.settings-row--clickable:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .settings-row--clickable:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.settings-row--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.settings-row__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-row__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: rgba(0, 0, 0, 0.04);
		color: hsl(var(--primary));
	}

	:global(.dark) .settings-row__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-row__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-row__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-row__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-row__label {
		color: #f3f4f6;
	}

	.settings-row__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-row__description {
		color: #9ca3af;
	}

	.settings-row__control {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.settings-row__chevron {
		width: 1.25rem;
		height: 1.25rem;
		color: #9ca3af;
	}

	:global(.dark) .settings-row__chevron {
		color: #6b7280;
	}
</style>
