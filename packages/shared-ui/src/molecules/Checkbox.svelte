<script lang="ts">
	interface Props {
		/** Whether the checkbox is checked */
		checked: boolean;
		/** Called when checked state changes */
		onchange?: (checked: boolean) => void;
		/** Label text */
		label?: string;
		/** Description text below label */
		description?: string;
		/** Disable the checkbox */
		disabled?: boolean;
		/** Show indeterminate state */
		indeterminate?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		checked = $bindable(),
		onchange,
		label,
		description,
		disabled = false,
		indeterminate = false,
		class: className = ''
	}: Props = $props();

	let inputElement: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (inputElement) {
			inputElement.indeterminate = indeterminate;
		}
	});

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		checked = target.checked;
		onchange?.(target.checked);
	}
</script>

<label class="checkbox-wrapper {disabled ? 'checkbox-wrapper--disabled' : ''} {className}">
	<div class="checkbox-input-wrapper">
		<input
			bind:this={inputElement}
			type="checkbox"
			{checked}
			{disabled}
			onchange={handleChange}
			class="checkbox-input"
		/>
		<div class="checkbox-box">
			{#if indeterminate}
				<svg class="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			{:else if checked}
				<svg class="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{/if}
		</div>
	</div>

	{#if label || description}
		<div class="checkbox-content">
			{#if label}
				<span class="checkbox-label">{label}</span>
			{/if}
			{#if description}
				<span class="checkbox-description">{description}</span>
			{/if}
		</div>
	{/if}
</label>

<style>
	.checkbox-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.checkbox-wrapper--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.checkbox-input-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.checkbox-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.checkbox-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		background-color: hsl(var(--color-surface));
		border: 2px solid hsl(var(--color-border-strong));
		border-radius: 0.25rem;
		transition: all 0.15s ease;
	}

	.checkbox-input:hover:not(:disabled) + .checkbox-box {
		border-color: hsl(var(--color-primary));
	}

	.checkbox-input:focus-visible + .checkbox-box {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 2px;
	}

	.checkbox-input:checked + .checkbox-box,
	.checkbox-input:indeterminate + .checkbox-box {
		background-color: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}

	.checkbox-icon {
		width: 0.875rem;
		height: 0.875rem;
		stroke: hsl(var(--color-primary-foreground));
	}

	.checkbox-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding-top: 0.0625rem;
	}

	.checkbox-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		line-height: 1.25rem;
	}

	.checkbox-description {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.25;
	}
</style>
