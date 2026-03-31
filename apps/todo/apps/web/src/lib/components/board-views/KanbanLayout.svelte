<script lang="ts">
	import type { Task } from '@todo/shared';
	import type { GroupedColumn } from '$lib/data/view-grouping';
	import ViewColumn from './ViewColumn.svelte';

	interface Props {
		columns: GroupedColumn[];
		onTaskDrop: (taskId: string, columnId: string) => void;
		onTaskToggle: (task: Task) => void;
		onTaskDelete: (taskId: string) => void;
		onTaskUpdate: (taskId: string, data: Partial<Task>) => void;
		onColumnRename?: (colIdx: number, name: string) => void;
		onColumnColorChange?: (colIdx: number, color: string) => void;
		onColumnMove?: (colIdx: number, dir: -1 | 1) => void;
		onColumnDelete?: (colIdx: number) => void;
		onAddColumn?: () => void;
	}

	let {
		columns,
		onTaskDrop,
		onTaskToggle,
		onTaskDelete,
		onTaskUpdate,
		onColumnRename,
		onColumnColorChange,
		onColumnMove,
		onColumnDelete,
		onAddColumn,
	}: Props = $props();
</script>

<div class="kanban-layout">
	{#each columns as column, i (column.id)}
		<div class="kanban-column-wrapper">
			<ViewColumn
				{column}
				columnIndex={i}
				totalColumns={columns.length}
				{onTaskDrop}
				{onTaskToggle}
				{onTaskDelete}
				{onTaskUpdate}
				onColumnRename={onColumnRename ? (name) => onColumnRename(i, name) : undefined}
				onColumnColorChange={onColumnColorChange ? (c) => onColumnColorChange(i, c) : undefined}
				onColumnMove={onColumnMove ? (dir) => onColumnMove(i, dir) : undefined}
				onColumnDelete={onColumnDelete ? () => onColumnDelete(i) : undefined}
			/>
		</div>
	{/each}

	{#if onAddColumn}
		<div class="kanban-column-wrapper">
			<button class="add-column-card" onclick={onAddColumn}>
				<span class="add-column-icon">+</span>
				<span class="add-column-label">Neues Board</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.kanban-layout {
		display: flex;
		gap: 1rem;
		height: 100%;
		overflow-x: auto;
		padding: 0 1rem 1rem;
		scroll-behavior: smooth;
		-ms-overflow-style: none;
		scrollbar-width: thin;
	}

	@media (min-width: 640px) {
		.kanban-layout {
			padding: 0 1.5rem 1rem;
		}
	}

	@media (min-width: 1024px) {
		.kanban-layout {
			padding: 0 2rem 1rem;
		}
	}

	.kanban-layout::-webkit-scrollbar {
		height: 6px;
	}

	.kanban-layout::-webkit-scrollbar-track {
		background: transparent;
	}

	.kanban-layout::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 3px;
	}

	.kanban-column-wrapper {
		min-width: 300px;
		max-width: 340px;
		flex-shrink: 0;
	}

	.add-column-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		min-height: 250px;
		border: 2px dashed color-mix(in srgb, var(--color-primary) 30%, transparent);
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--color-primary) 3%, transparent);
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-column-card:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}
	.add-column-icon {
		font-size: 1.5rem;
		font-weight: 300;
		color: var(--color-primary);
		line-height: 1;
	}
	.add-column-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-primary);
	}
</style>
