<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Current value (HH:mm format, null = not set) */
		value: string | null;
		/** Change handler */
		onchange: (value: string | null) => void;
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
		placeholder = '--:--',
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

		// Validate HH:mm format
		if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(rawValue)) {
			onchange(rawValue);
		}
	}

	function handleClear() {
		onchange(null);
	}
</script>

<div
	class="settings-time {border ? 'settings-time--border' : ''} {disabled
		? 'settings-time--disabled'
		: ''} {className}"
>
	<div class="settings-time__content">
		{#if icon}
			<span class="settings-time__icon">
				{@render icon()}
			</span>
		{/if}
		<div class="settings-time__text">
			<span class="settings-time__label">{label}</span>
			{#if description}
				<span class="settings-time__description">{description}</span>
			{/if}
		</div>
	</div>

	<div class="settings-time__input-wrapper">
		<input
			type="time"
			class="settings-time__input"
			value={value ?? ''}
			oninput={handleInput}
			{placeholder}
			{disabled}
			aria-label={label}
		/>
		{#if value}
			<button
				type="button"
				class="settings-time__clear"
				onclick={handleClear}
				aria-label="Clear time"
				{disabled}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.settings-time {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.settings-time--border {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-time--border {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-time--border:last-child {
		border-bottom: none;
	}

	.settings-time--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-time__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-time__icon {
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

	:global(.dark) .settings-time__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-time__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-time__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-time__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-time__label {
		color: #f3f4f6;
	}

	.settings-time__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-time__description {
		color: #9ca3af;
	}

	/* Input wrapper */
	.settings-time__input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* Time Input - Glass style */
	.settings-time__input {
		width: 6rem;
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

	:global(.dark) .settings-time__input {
		color: #f3f4f6;
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.settings-time__input:hover:not(:disabled) {
		border-color: rgba(0, 0, 0, 0.2);
		background-color: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .settings-time__input:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.25);
		background-color: rgba(255, 255, 255, 0.12);
	}

	.settings-time__input:focus-visible {
		outline: 2px solid hsl(var(--primary) / 0.4);
		outline-offset: 2px;
		border-color: hsl(var(--primary));
	}

	.settings-time__input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Clear button */
	.settings-time__clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		color: #6b7280;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.settings-time__clear:hover:not(:disabled) {
		color: #ef4444;
		background-color: rgba(239, 68, 68, 0.1);
	}

	:global(.dark) .settings-time__clear {
		color: #9ca3af;
	}

	:global(.dark) .settings-time__clear:hover:not(:disabled) {
		color: #ef4444;
		background-color: rgba(239, 68, 68, 0.2);
	}

	.settings-time__clear:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Style the time input appearance */
	.settings-time__input::-webkit-calendar-picker-indicator {
		filter: invert(0.5);
		cursor: pointer;
	}

	:global(.dark) .settings-time__input::-webkit-calendar-picker-indicator {
		filter: invert(0.7);
	}
</style>
