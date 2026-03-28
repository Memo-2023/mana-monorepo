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
	}

	let { columns, onTaskDrop, onTaskToggle, onTaskDelete, onTaskUpdate }: Props = $props();
</script>

<div class="kanban-layout">
	{#each columns as column (column.id)}
		<div class="kanban-column-wrapper">
			<ViewColumn
				{column}
				{onTaskDrop}
				{onTaskToggle}
				{onTaskDelete}
				{onTaskUpdate}
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
