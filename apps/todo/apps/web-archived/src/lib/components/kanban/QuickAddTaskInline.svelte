<script lang="ts">
	import { Plus } from '@manacore/shared-icons';

	interface Props {
		onAdd: (title: string) => void;
		placeholder?: string;
	}

	let { onAdd, placeholder = 'Neue Aufgabe...' }: Props = $props();

	let isAdding = $state(false);
	let title = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	function handleSubmit() {
		if (title.trim()) {
			onAdd(title.trim());
			title = '';
			// Keep input open for rapid adding
			inputRef?.focus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'Escape') {
			title = '';
			isAdding = false;
		}
	}

	function handleBlur() {
		if (title.trim()) {
			handleSubmit();
		}
		isAdding = false;
	}

	function activate() {
		isAdding = true;
	}

	$effect(() => {
		if (isAdding && inputRef) {
			inputRef.focus();
		}
	});
</script>

<div class="inline-add-row" class:active={isAdding}>
	<!-- Circle matching TaskItem checkbox style -->
	{#if isAdding}
		<div class="add-checkbox">
			<Plus size={12} />
		</div>
		<input
			bind:this={inputRef}
			bind:value={title}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			{placeholder}
			class="add-input"
		/>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="inline-add-trigger"
			onclick={activate}
			onkeydown={(e) => e.key === 'Enter' && activate()}
			role="button"
			tabindex="0"
		>
			<div class="add-checkbox placeholder">
				<Plus size={12} />
			</div>
			<span class="add-placeholder">{placeholder}</span>
		</div>
	{/if}
</div>

<style>
	.inline-add-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.2rem 1rem;
		transition: all 0.15s ease;
	}

	.inline-add-trigger {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		cursor: text;
	}

	.add-checkbox {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		border: 1.5px dashed rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--color-muted-foreground);
		transition: all 0.15s;
		margin-top: 0.2rem;
		/* Offset to align with task cards: priority-dot(3px) + gap(0.625rem) */
		margin-left: calc(3px + 0.625rem);
	}

	:global(.dark) .add-checkbox {
		border-color: rgba(255, 255, 255, 0.35);
	}

	.inline-add-row.active .add-checkbox,
	.inline-add-trigger:hover .add-checkbox {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.add-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.9375rem;
		font-weight: 400;
		color: var(--color-foreground);
		padding: 0;
		line-height: 1.5;
	}

	.add-input::placeholder {
		color: var(--color-muted-foreground);
		opacity: 0.5;
	}

	.add-placeholder {
		font-size: 0.9375rem;
		font-weight: 400;
		color: var(--color-muted-foreground);
		opacity: 0.5;
		transition: all 0.15s;
	}

	.inline-add-trigger:hover .add-placeholder {
		opacity: 0.8;
		color: var(--color-foreground);
	}
</style>
