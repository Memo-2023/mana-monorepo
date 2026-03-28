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

<div class="grid-layout">
	{#each columns as column (column.id)}
		<div class="grid-cell">
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
</style>
