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

<div class="grid-layout">
	{#each columns as column, i (column.id)}
		<div class="grid-cell">
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
		<div class="grid-cell">
			<button class="add-column-card" onclick={onAddColumn}>
				<span class="add-icon">+</span>
				<span class="add-label">Neues Board</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.grid-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 1rem;
		height: 100%;
		padding: 0 1rem 1rem;
	}

	@media (min-width: 640px) {
		.grid-layout {
			padding: 0 1.5rem 1rem;
		}
	}

	@media (min-width: 1024px) {
		.grid-layout {
			padding: 0 2rem 1rem;
		}
	}

	/* Single column on mobile */
	@media (max-width: 639px) {
		.grid-layout {
			grid-template-columns: 1fr;
			grid-template-rows: auto;
			overflow-y: auto;
		}
	}

	.grid-cell {
		min-height: 0;
		overflow: hidden;
	}

	/* In grid layout, columns should fill available height */
	.grid-cell :global(.view-column) {
		height: 100%;
		max-height: none;
	}

	.add-column-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
		min-height: 200px;
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
	}
	:global(.dark) .add-column-card:hover {
		background: rgba(139, 92, 246, 0.12);
	}
	.add-icon {
		font-size: 1.5rem;
		font-weight: 300;
		color: #8b5cf6;
	}
	.add-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #8b5cf6;
	}
</style>
