<script lang="ts">
	import type { Snippet } from 'svelte';

	interface SelectOption {
		value: string | number | null;
		label: string;
	}

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Available options */
		options: SelectOption[];
		/** Current selected value */
		value: string | number | null;
		/** Change handler */
		onchange: (value: string | number | null) => void;
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
		options,
		value,
		onchange,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const rawValue = target.value;

		// Handle null values (stored as empty string in select)
		if (rawValue === '') {
			onchange(null);
			return;
		}

		// Try to parse as number if the original options had numbers
		const numValue = Number(rawValue);
		if (!isNaN(numValue) && options.some((o) => o.value === numValue)) {
			onchange(numValue);
		} else {
			onchange(rawValue);
		}
	}
</script>

<div
	class="settings-select {border ? 'settings-select--border' : ''} {disabled
		? 'settings-select--disabled'
		: ''} {className}"
>
	<div class="settings-select__content">
		{#if icon}
			<span class="settings-select__icon">
				{@render icon()}
			</span>
		{/if}
		<div class="settings-select__text">
			<span class="settings-select__label">{label}</span>
			{#if description}
				<span class="settings-select__description">{description}</span>
			{/if}
		</div>
	</div>

	<select
		class="settings-select__dropdown"
		value={value ?? ''}
		onchange={handleChange}
		{disabled}
		aria-label={label}
	>
		{#each options as option}
			<option value={option.value ?? ''}>{option.label}</option>
		{/each}
	</select>
</div>

<style>
	.settings-select {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.settings-select--border {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-select--border {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-select--border:last-child {
		border-bottom: none;
	}

	.settings-select--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-select__content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.settings-select__icon {
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

	:global(.dark) .settings-select__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-select__icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.settings-select__text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.settings-select__label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .settings-select__label {
		color: #f3f4f6;
	}

	.settings-select__description {
		font-size: 0.8125rem;
		color: #6b7280;
		line-height: 1.4;
	}

	:global(.dark) .settings-select__description {
		color: #9ca3af;
	}

	/* Select Dropdown - Glass style */
	.settings-select__dropdown {
		min-width: 8rem;
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		background-color: rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		background-size: 1rem;
		transition: all 0.2s ease;
	}

	:global(.dark) .settings-select__dropdown {
		color: #f3f4f6;
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
	}

	.settings-select__dropdown:hover:not(:disabled) {
		border-color: rgba(0, 0, 0, 0.2);
		background-color: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .settings-select__dropdown:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.25);
		background-color: rgba(255, 255, 255, 0.12);
	}

	.settings-select__dropdown:focus-visible {
		outline: 2px solid hsl(var(--primary) / 0.4);
		outline-offset: 2px;
		border-color: hsl(var(--primary));
	}

	.settings-select__dropdown:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.settings-select__dropdown option {
		background-color: white;
		color: #374151;
	}

	:global(.dark) .settings-select__dropdown option {
		background-color: #1f2937;
		color: #f3f4f6;
	}
</style>
