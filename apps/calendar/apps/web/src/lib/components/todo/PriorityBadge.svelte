<script lang="ts">
	import type { TaskPriority } from '$lib/api/todos';
	import { PRIORITY_COLORS, PRIORITY_LABELS } from '$lib/api/todos';

	interface Props {
		priority: TaskPriority;
		variant?: 'dot' | 'badge' | 'pill';
		size?: 'sm' | 'md';
		showLabel?: boolean;
	}

	let { priority, variant = 'dot', size = 'md', showLabel = false }: Props = $props();

	const color = $derived(PRIORITY_COLORS[priority]);
	const label = $derived(PRIORITY_LABELS[priority]);
</script>

{#if variant === 'dot'}
	<span
		class="priority-dot"
		class:size-sm={size === 'sm'}
		style="--priority-color: {color};"
		title={label}
		aria-label="Priorität: {label}"
	></span>
{:else if variant === 'badge'}
	<span
		class="priority-badge"
		class:size-sm={size === 'sm'}
		style="--priority-color: {color};"
		title={label}
	>
		{#if showLabel}
			{label}
		{:else}
			{priority.charAt(0).toUpperCase()}
		{/if}
	</span>
{:else if variant === 'pill'}
	<span class="priority-pill" class:size-sm={size === 'sm'} style="--priority-color: {color};">
		<span class="pill-dot"></span>
		{#if showLabel}
			<span class="pill-label">{label}</span>
		{/if}
	</span>
{/if}

<style>
	/* Dot variant */
	.priority-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--priority-color);
		flex-shrink: 0;
	}

	.priority-dot.size-sm {
		width: 6px;
		height: 6px;
	}

	/* Badge variant */
	.priority-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 4px;
		background: var(--priority-color);
		color: white;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.priority-badge.size-sm {
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		font-size: 0.625rem;
	}

	/* Pill variant */
	.priority-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 2px 8px;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--priority-color) 15%, transparent);
		border: 1px solid color-mix(in srgb, var(--priority-color) 30%, transparent);
	}

	.priority-pill.size-sm {
		gap: 4px;
		padding: 1px 6px;
	}

	.pill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--priority-color);
	}

	.priority-pill.size-sm .pill-dot {
		width: 5px;
		height: 5px;
	}

	.pill-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--priority-color);
	}

	.priority-pill.size-sm .pill-label {
		font-size: 0.6875rem;
	}
</style>
