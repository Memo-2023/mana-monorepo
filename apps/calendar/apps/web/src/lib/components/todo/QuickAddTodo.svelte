<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { Plus, X } from 'lucide-svelte';

	interface Props {
		placeholder?: string;
		onsubmit?: () => void;
		oncancel?: () => void;
		autofocus?: boolean;
		showButton?: boolean;
	}

	let {
		placeholder = 'Neue Aufgabe...',
		onsubmit,
		oncancel,
		autofocus = false,
		showButton = true,
	}: Props = $props();

	let title = $state('');
	let isExpanded = $state(!showButton);
	let isSubmitting = $state(false);
	let inputRef: HTMLInputElement | undefined = $state();

	function expand() {
		isExpanded = true;
		// Focus input after DOM update
		setTimeout(() => inputRef?.focus(), 0);
	}

	function collapse() {
		isExpanded = false;
		title = '';
		oncancel?.();
	}

	async function handleSubmit(e?: Event) {
		e?.preventDefault();

		const trimmedTitle = title.trim();
		if (!trimmedTitle || isSubmitting) return;

		isSubmitting = true;

		const result = await todosStore.createTodo({
			title: trimmedTitle,
			priority: 'medium',
		});

		isSubmitting = false;

		if (!result.error) {
			title = '';
			onsubmit?.();

			// Keep input focused for quick successive adds
			inputRef?.focus();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			collapse();
		}
	}

	function handleBlur() {
		// Only collapse if empty and showButton is true
		if (showButton && !title.trim()) {
			collapse();
		}
	}
</script>

{#if showButton && !isExpanded}
	<button type="button" class="add-button" onclick={expand}>
		<Plus size={16} />
		<span>Aufgabe hinzufügen</span>
	</button>
{:else}
	<form class="quick-add-form" onsubmit={handleSubmit}>
		<input
			bind:this={inputRef}
			bind:value={title}
			type="text"
			class="quick-add-input"
			{placeholder}
			disabled={isSubmitting}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			autofocus={autofocus || isExpanded}
		/>

		{#if showButton}
			<button type="button" class="cancel-button" onclick={collapse} disabled={isSubmitting}>
				<X size={14} />
			</button>
		{/if}

		<button
			type="submit"
			class="submit-button"
			disabled={!title.trim() || isSubmitting}
			aria-label="Aufgabe erstellen"
		>
			{#if isSubmitting}
				<span class="spinner"></span>
			{:else}
				<Plus size={14} />
			{/if}
		</button>
	</form>
{/if}

<style>
	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.add-button:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	.quick-add-form {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem;
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		transition: border-color 150ms ease;
	}

	.quick-add-form:focus-within {
		border-color: hsl(var(--color-primary));
	}

	.quick-add-input {
		flex: 1;
		min-width: 0;
		padding: 0.375rem 0.5rem;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}

	.quick-add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.quick-add-input:disabled {
		opacity: 0.5;
	}

	.cancel-button,
	.submit-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.cancel-button {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}

	.cancel-button:hover:not(:disabled) {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.submit-button {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.submit-button:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.9);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid hsl(var(--color-primary-foreground) / 0.3);
		border-top-color: hsl(var(--color-primary-foreground));
		border-radius: 50%;
		animation: spin 600ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
