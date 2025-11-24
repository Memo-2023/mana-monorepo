<script lang="ts">
	interface Props {
		/** Current value */
		value: string;
		/** Called on input */
		oninput?: (value: string) => void;
		/** Called on change (blur) */
		onchange?: (value: string) => void;
		/** Label text */
		label?: string;
		/** Placeholder text */
		placeholder?: string;
		/** Number of visible rows */
		rows?: number;
		/** Maximum character count */
		maxlength?: number;
		/** Show character count */
		showCount?: boolean;
		/** Error message */
		error?: string;
		/** Disable the textarea */
		disabled?: boolean;
		/** Mark as required */
		required?: boolean;
		/** Enable auto-resize based on content */
		autoResize?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		value = $bindable(),
		oninput,
		onchange,
		label,
		placeholder,
		rows = 3,
		maxlength,
		showCount = false,
		error,
		disabled = false,
		required = false,
		autoResize = false,
		class: className = ''
	}: Props = $props();

	let textareaElement: HTMLTextAreaElement | null = $state(null);

	const charCount = $derived(value?.length ?? 0);
	const isOverLimit = $derived(maxlength ? charCount > maxlength : false);

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		oninput?.(target.value);

		if (autoResize && textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = `${textareaElement.scrollHeight}px`;
		}
	}

	function handleChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		onchange?.(target.value);
	}
</script>

<div class="textarea-wrapper {className}">
	{#if label}
		<label class="textarea-label">
			{label}
			{#if required}
				<span class="textarea-required">*</span>
			{/if}
		</label>
	{/if}

	<textarea
		bind:this={textareaElement}
		{value}
		{placeholder}
		{rows}
		{maxlength}
		{disabled}
		{required}
		oninput={handleInput}
		onchange={handleChange}
		class="textarea-input {error || isOverLimit ? 'textarea-input--error' : ''} {autoResize ? 'textarea-input--auto-resize' : ''}"
	></textarea>

	<div class="textarea-footer">
		{#if error}
			<p class="textarea-error">{error}</p>
		{:else}
			<span></span>
		{/if}

		{#if showCount || maxlength}
			<span class="textarea-count {isOverLimit ? 'textarea-count--error' : ''}">
				{charCount}{#if maxlength}/{maxlength}{/if}
			</span>
		{/if}
	</div>
</div>

<style>
	.textarea-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.textarea-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.textarea-required {
		color: hsl(var(--color-error));
		margin-left: 0.125rem;
	}

	.textarea-input {
		width: 100%;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-family: inherit;
		line-height: 1.5;
		color: hsl(var(--color-foreground));
		background-color: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		resize: vertical;
		transition: all 0.15s ease;
	}

	.textarea-input:hover:not(:disabled) {
		border-color: hsl(var(--color-border-strong));
	}

	.textarea-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.textarea-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		resize: none;
	}

	.textarea-input--error {
		border-color: hsl(var(--color-error));
	}

	.textarea-input--error:focus {
		border-color: hsl(var(--color-error));
		box-shadow: 0 0 0 3px hsl(var(--color-error) / 0.1);
	}

	.textarea-input--auto-resize {
		resize: none;
		overflow: hidden;
	}

	.textarea-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.textarea-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	.textarea-error {
		font-size: 0.75rem;
		color: hsl(var(--color-error));
		margin: 0;
	}

	.textarea-count {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-left: auto;
	}

	.textarea-count--error {
		color: hsl(var(--color-error));
	}
</style>
