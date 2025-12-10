<script lang="ts">
	import type { TaskPriority } from '@todo/shared';

	interface Props {
		value: TaskPriority;
		onChange: (priority: TaskPriority) => void;
	}

	let { value, onChange }: Props = $props();

	const priorities: { value: TaskPriority; label: string; color: string }[] = [
		{ value: 'low', label: 'Niedrig', color: '#22c55e' },
		{ value: 'medium', label: 'Mittel', color: '#eab308' },
		{ value: 'high', label: 'Hoch', color: '#f97316' },
		{ value: 'urgent', label: 'Dringend', color: '#ef4444' },
	];
</script>

<div class="priority-buttons">
	{#each priorities as p}
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .priority-btn {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e5e7eb;
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
