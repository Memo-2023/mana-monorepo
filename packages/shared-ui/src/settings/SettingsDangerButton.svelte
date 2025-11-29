<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Button label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Click handler */
		onclick: () => void;
		/** Button text (default: label) */
		buttonText?: string;
		/** Show border at bottom */
		border?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		label,
		description,
		icon,
		onclick,
		buttonText,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();
</script>

<div
	class="settings-danger-button {border ? 'settings-danger-button--border' : ''} {disabled ? 'settings-danger-button--disabled' : ''} {className}"
>
	<div class="settings-danger-button__content">
		{#if icon}
			<span class="settings-danger-button__icon">
				{@render icon()}
			</span>
		{/if}
		<div class="settings-danger-button__text">
			<span class="settings-danger-button__label">{label}</span>
			{#if description}
				<span class="settings-danger-button__description">{description}</span>
			{/if}
		</div>
	</div>

	<button
		type="button"
		{onclick}
		class="settings-danger-button__button"
		{disabled}
	>
		{buttonText || label}
	</button>
</div>

<style>
	.settings-danger-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.settings-danger-button--border {
		border-bottom: 1px solid rgba(239, 68, 68, 0.12);
	}

	:global(.dark) .settings-danger-button--border {
		border-bottom-color: rgba(239, 68, 68, 0.18);
	}

	.settings-danger-button--border:last-child {
		border-bottom: none;
	}

	.settings-danger-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-danger-button__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-danger-button__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: rgba(239, 68, 68, 0.1);
		color: hsl(var(--destructive));
	}

	:global(.dark) .settings-danger-button__icon {
		background: rgba(239, 68, 68, 0.15);
	}

	.settings-danger-button__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-danger-button__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-danger-button__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-danger-button__label {
		color: #f3f4f6;
	}

	.settings-danger-button__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-danger-button__description {
		color: #9ca3af;
	}

	.settings-danger-button__button {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--destructive));
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 0.5rem;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	:global(.dark) .settings-danger-button__button {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.25);
	}

	.settings-danger-button__button:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
	}

	:global(.dark) .settings-danger-button__button:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.25);
		border-color: rgba(239, 68, 68, 0.35);
	}

	.settings-danger-button__button:disabled {
		cursor: not-allowed;
	}

	.settings-danger-button__button:focus-visible {
		outline: 2px solid rgba(239, 68, 68, 0.4);
		outline-offset: 2px;
	}
</style>
