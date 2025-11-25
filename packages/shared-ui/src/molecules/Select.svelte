<script lang="ts">
	import type { SelectOption } from './Select.types';

	interface Props {
		/** Current selected value */
		value: string;
		/** Available options */
		options: SelectOption[];
		/** Called when selection changes */
		onchange?: (value: string) => void;
		/** Label text */
		label?: string;
		/** Placeholder text (shown as first disabled option) */
		placeholder?: string;
		/** Error message */
		error?: string;
		/** Disable the select */
		disabled?: boolean;
		/** Mark as required */
		required?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Unique ID for accessibility */
		id?: string;
	}

	let {
		value = $bindable(),
		options,
		onchange,
		label,
		placeholder,
		error,
		disabled = false,
		required = false,
		class: className = '',
		id = `select-${Math.random().toString(36).slice(2, 9)}`
	}: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		onchange?.(target.value);
	}
</script>

<div class="select-wrapper {className}">
	{#if label}
		<label for={id} class="select-label">
			{label}
			{#if required}
				<span class="select-required">*</span>
			{/if}
		</label>
	{/if}

	<div class="select-container">
		<select
			{id}
			{value}
			{disabled}
			{required}
			onchange={handleChange}
			class="select-input {error ? 'select-input--error' : ''}"
		>
			{#if placeholder}
				<option value="" disabled selected={!value}>{placeholder}</option>
			{/if}
			{#each options as option}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>
		<div class="select-icon">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>

	{#if error}
		<p class="select-error">{error}</p>
	{/if}
</div>

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.select-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.select-required {
		color: hsl(var(--color-error));
		margin-left: 0.125rem;
	}

	.select-container {
		position: relative;
	}

	.select-input {
		width: 100%;
		appearance: none;
		padding: 0.625rem 2.5rem 0.625rem 1rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		background-color: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.select-input:hover:not(:disabled) {
		border-color: hsl(var(--color-border-strong));
	}

	.select-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.select-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select-input--error {
		border-color: hsl(var(--color-error));
	}

	.select-input--error:focus {
		border-color: hsl(var(--color-error));
		box-shadow: 0 0 0 3px hsl(var(--color-error) / 0.1);
	}

	.select-icon {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: hsl(var(--color-muted-foreground));
	}

	.select-error {
		font-size: 0.75rem;
		color: hsl(var(--color-error));
		margin: 0;
	}
</style>
