<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Toggle state */
		isOn: boolean;
		/** Toggle handler */
		onToggle: (value: boolean) => void;
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
		isOn = false,
		onToggle,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleToggle() {
		if (!disabled) {
			onToggle(!isOn);
		}
	}
</script>

<div
	class="settings-toggle {border ? 'settings-toggle--border' : ''} {disabled ? 'settings-toggle--disabled' : ''} {className}"
>
	<div class="settings-toggle__content">
		{#if icon}
			<span class="settings-toggle__icon">
				{@render icon()}
			</span>
		{/if}
		<div class="settings-toggle__text">
			<span class="settings-toggle__label">{label}</span>
			{#if description}
				<span class="settings-toggle__description">{description}</span>
			{/if}
		</div>
	</div>

	<button
		type="button"
		onclick={handleToggle}
		class="settings-toggle__switch {isOn ? 'settings-toggle__switch--on' : ''}"
		role="switch"
		aria-checked={isOn}
		aria-label={label}
		{disabled}
	>
		<span class="settings-toggle__thumb"></span>
	</button>
</div>

<style>
	.settings-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.settings-toggle--border {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-toggle--border {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-toggle--border:last-child {
		border-bottom: none;
	}

	.settings-toggle--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-toggle__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-toggle__icon {
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

	:global(.dark) .settings-toggle__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-toggle__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-toggle__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-toggle__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-toggle__label {
		color: #f3f4f6;
	}

	.settings-toggle__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-toggle__description {
		color: #9ca3af;
	}

	/* Toggle Switch - Glass style */
	.settings-toggle__switch {
		position: relative;
		width: 3rem;
		height: 1.75rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(0, 0, 0, 0.08);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	:global(.dark) .settings-toggle__switch {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.settings-toggle__switch:disabled {
		cursor: not-allowed;
	}

	.settings-toggle__switch--on {
		background: hsl(var(--primary));
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
	}

	:global(.dark) .settings-toggle__switch--on {
		background: hsl(var(--primary));
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
	}

	.settings-toggle__thumb {
		position: absolute;
		top: 0.0625rem;
		left: 0.0625rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
		background-color: white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.15),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.settings-toggle__switch--on .settings-toggle__thumb {
		transform: translateX(1.25rem);
	}

	.settings-toggle__switch:hover:not(:disabled) {
		border-color: rgba(0, 0, 0, 0.2);
	}

	:global(.dark) .settings-toggle__switch:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.25);
	}

	.settings-toggle__switch--on:hover:not(:disabled) {
		filter: brightness(1.1);
		border-color: hsl(var(--primary));
	}

	.settings-toggle__switch:focus-visible {
		outline: 2px solid hsl(var(--primary) / 0.4);
		outline-offset: 2px;
	}
</style>
