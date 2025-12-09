<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Current value (null = empty/disabled) */
		value: number | null;
		/** Change handler */
		onchange: (value: number | null) => void;
		/** Minimum value */
		min?: number;
		/** Maximum value */
		max?: number;
		/** Step increment */
		step?: number;
		/** Placeholder text when empty */
		placeholder?: string;
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
		value,
		onchange,
		min,
		max,
		step = 1,
		placeholder = '',
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const rawValue = target.value.trim();

		if (rawValue === '') {
			onchange(null);
			return;
		}

		const numValue = Number(rawValue);
		if (!isNaN(numValue)) {
			// Clamp to min/max if specified
			let clampedValue = numValue;
			if (min !== undefined && clampedValue < min) clampedValue = min;
			if (max !== undefined && clampedValue > max) clampedValue = max;
			onchange(clampedValue);
		}
	}
</script>

<div
	class="settings-number {border ? 'settings-number--border' : ''} {disabled
		? 'settings-number--disabled'
		: ''} {className}"
>
	<div class="settings-number__content">
		{#if icon}
			<span class="settings-number__icon">
				{@render icon()}
			</span>
		{/if}
		<div class="settings-number__text">
			<span class="settings-number__label">{label}</span>
			{#if description}
				<span class="settings-number__description">{description}</span>
			{/if}
		</div>
	</div>

	<input
		type="number"
		class="settings-number__input"
		value={value ?? ''}
		oninput={handleInput}
		{min}
		{max}
		{step}
		{placeholder}
		{disabled}
		aria-label={label}
	/>
</div>

<style>
	.settings-number {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.settings-number--border {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-number--border {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-number--border:last-child {
		border-bottom: none;
	}

	.settings-number--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-number__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-number__icon {
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

	:global(.dark) .settings-number__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-number__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-number__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-number__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-number__label {
		color: #f3f4f6;
	}

	.settings-number__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-number__description {
		color: #9ca3af;
	}

	/* Number Input - Glass style */
	.settings-number__input {
		width: 5rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		text-align: center;
		background-color: rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	:global(.dark) .settings-number__input {
		color: #f3f4f6;
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.settings-number__input:hover:not(:disabled) {
		border-color: rgba(0, 0, 0, 0.2);
		background-color: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .settings-number__input:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.25);
		background-color: rgba(255, 255, 255, 0.12);
	}

	.settings-number__input:focus-visible {
		outline: 2px solid hsl(var(--primary) / 0.4);
		outline-offset: 2px;
		border-color: hsl(var(--primary));
	}

	.settings-number__input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.settings-number__input::placeholder {
		color: #9ca3af;
		font-weight: 400;
	}

	:global(.dark) .settings-number__input::placeholder {
		color: #6b7280;
	}

	/* Hide spinner buttons */
	.settings-number__input::-webkit-outer-spin-button,
	.settings-number__input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.settings-number__input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
