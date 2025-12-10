<script lang="ts">
	import { Check } from 'lucide-svelte';

	interface Props {
		checked: boolean;
		loading?: boolean;
		size?: 'sm' | 'md' | 'lg';
		onchange?: (checked: boolean) => void;
	}

	let { checked, loading = false, size = 'md', onchange }: Props = $props();

	const sizes = {
		sm: { box: 14, icon: 10 },
		md: { box: 18, icon: 12 },
		lg: { box: 22, icon: 16 },
	};

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		if (!loading && onchange) {
			onchange(!checked);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			if (!loading && onchange) {
				onchange(!checked);
			}
		}
	}
</script>

<button
	type="button"
	class="todo-checkbox"
	class:checked
	class:loading
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
	class:size-lg={size === 'lg'}
	style="--box-size: {sizes[size].box}px; --icon-size: {sizes[size].icon}px;"
	onclick={handleClick}
	onkeydown={handleKeydown}
	disabled={loading}
	aria-checked={checked}
	aria-label={checked ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
	role="checkbox"
>
	{#if loading}
		<span class="spinner"></span>
	{:else if checked}
		<Check size={sizes[size].icon} strokeWidth={3} />
	{/if}
</button>

<style>
	.todo-checkbox {
		width: var(--box-size);
		height: var(--box-size);
		min-width: var(--box-size);
		border-radius: 4px;
		border: 2px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 150ms ease;
		padding: 0;
	}

	.todo-checkbox:hover:not(:disabled) {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.todo-checkbox:focus-visible {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 2px;
	}

	.todo-checkbox.checked {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.todo-checkbox.checked:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.8);
		border-color: hsl(var(--color-primary) / 0.8);
	}

	.todo-checkbox:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.todo-checkbox.loading {
		cursor: wait;
	}

	.spinner {
		width: calc(var(--icon-size) - 2px);
		height: calc(var(--icon-size) - 2px);
		border: 2px solid hsl(var(--color-muted-foreground) / 0.3);
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 600ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Size variants */
	.size-sm {
		border-radius: 3px;
		border-width: 1.5px;
	}

	.size-lg {
		border-radius: 5px;
	}
</style>
