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
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
	}

	:global(.dark) .kanban-layout::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
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
		border: 2px dashed rgba(139, 92, 246, 0.3);
		border-radius: 0.375rem;
		background: rgba(139, 92, 246, 0.03);
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-column-card:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.08);
	}
	:global(.dark) .add-column-card {
		background: rgba(139, 92, 246, 0.05);
		border-color: rgba(139, 92, 246, 0.25);
	}
	:global(.dark) .add-column-card:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.12);
	}
	.add-column-icon {
		font-size: 1.5rem;
		font-weight: 300;
		color: #8b5cf6;
		line-height: 1;
	}
	.add-column-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #8b5cf6;
	}
</style>
