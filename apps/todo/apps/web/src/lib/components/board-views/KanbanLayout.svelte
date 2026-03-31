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
</style>
