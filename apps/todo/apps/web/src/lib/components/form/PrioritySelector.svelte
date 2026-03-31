<script lang="ts">
	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';

	interface Props {
		value: TaskPriority;
		onChange: (priority: TaskPriority) => void;
	}

	let { value, onChange }: Props = $props();
</script>

<div class="priority-buttons">
	{#each PRIORITY_OPTIONS as p}
		<button
			type="button"
			class="priority-btn"
			class:selected={value === p.value}
			style="--priority-color: {p.color}"
			onclick={() => onChange(p.value)}
		>
			<span class="priority-dot" style="background-color: {p.color}"></span>
			{p.label}
		</button>
	{/each}
</div>

<style>
	.priority-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.priority-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: 9999px;
		background: var(--color-surface);
		font-size: 0.8125rem;
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}

	.priority-btn:hover {
		border-color: var(--priority-color);
	}

	.priority-btn.selected {
		background: color-mix(in srgb, var(--priority-color) 15%, transparent);
		border-color: var(--priority-color);
		color: var(--priority-color);
	}

	.priority-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
	}
</style>
