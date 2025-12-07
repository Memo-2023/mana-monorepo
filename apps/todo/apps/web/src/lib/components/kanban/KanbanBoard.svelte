<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { KanbanColumn, Task, TaskPriority } from '@todo/shared';
	import KanbanColumnComponent from './KanbanColumn.svelte';
	import AddColumnButton from './AddColumnButton.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';

	interface Props {
		projectId?: string;
		filterPriorities?: TaskPriority[];
		filterProjectId?: string | null;
		filterLabelIds?: string[];
		filterSearchQuery?: string;
	}

	let {
		projectId,
		filterPriorities = [],
		filterProjectId = null,
		filterLabelIds = [],
		filterSearchQuery = '',
	}: Props = $props();

	// Local columns state for drag and drop
	let localColumns = $state<KanbanColumn[]>([]);

	// Sync with store
	$effect(() => {
		localColumns = [...kanbanStore.columns];
	});

	const flipDurationMs = 200;

	function handleColumnDndConsider(e: CustomEvent<{ items: KanbanColumn[] }>) {
		localColumns = e.detail.items;
	}

	function handleColumnDndFinalize(e: CustomEvent<{ items: KanbanColumn[] }>) {
		localColumns = e.detail.items.filter((c) => c.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		const columnIds = localColumns.map((c) => c.id);
		kanbanStore.reorderColumns(columnIds);
	}

	async function handleAddColumn(name: string) {
		await kanbanStore.createColumn({ name, projectId });
	}

	async function handleUpdateColumn(columnId: string, data: { name?: string; color?: string }) {
		await kanbanStore.updateColumn(columnId, data);
	}

	async function handleDeleteColumn(columnId: string) {
		if (confirm('Spalte wirklich löschen? Alle Aufgaben werden in die erste Spalte verschoben.')) {
			await kanbanStore.deleteColumn(columnId);
		}
	}

	async function handleTasksReorder(columnId: string, taskIds: string[]) {
		await kanbanStore.reorderTasksInColumn(columnId, taskIds);
	}

	async function handleAddTask(columnId: string, title: string) {
		await kanbanStore.createTaskInColumn(columnId, title, projectId);
	}

	async function handleTaskMove(taskId: string, toColumnId: string, order: number) {
		// Find which column the task is currently in
		let fromColumnId: string | null = null;
		for (const [colId, tasks] of Object.entries(kanbanStore.tasksByColumn)) {
			if (tasks.some((t) => t.id === taskId)) {
				fromColumnId = colId;
				break;
			}
		}

		if (fromColumnId && fromColumnId !== toColumnId) {
			await kanbanStore.moveTaskToColumn(taskId, fromColumnId, toColumnId, order);
		}
	}

	function getTasksForColumn(columnId: string): Task[] {
		let tasks = kanbanStore.tasksByColumn[columnId] || [];

		// Apply filters
		if (filterPriorities.length > 0) {
			tasks = tasks.filter((t) => filterPriorities.includes(t.priority));
		}

		if (filterProjectId !== null) {
			tasks = tasks.filter((t) => t.projectId === filterProjectId);
		}

		if (filterLabelIds.length > 0) {
			tasks = tasks.filter((t) => t.labels?.some((l) => filterLabelIds.includes(l.id)));
		}

		if (filterSearchQuery.trim()) {
			const query = filterSearchQuery.toLowerCase().trim();
			tasks = tasks.filter(
				(t) =>
					t.title.toLowerCase().includes(query) ||
					(t.description && t.description.toLowerCase().includes(query))
			);
		}

		return tasks;
	}
</script>

<div class="kanban-board h-full">
	{#if kanbanStore.loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"
			></div>
		</div>
	{:else if kanbanStore.error}
		<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
			{kanbanStore.error}
		</div>
	{:else}
		<div
			class="columns-container flex gap-4 overflow-x-auto pb-4 h-full"
			use:dndzone={{
				items: localColumns,
				flipDurationMs,
				type: 'columns',
				dropTargetStyle: {},
			}}
			onconsider={handleColumnDndConsider}
			onfinalize={handleColumnDndFinalize}
		>
			{#each localColumns.filter((c) => c.id !== SHADOW_PLACEHOLDER_ITEM_ID) as column (column.id)}
				<div animate:flip={{ duration: flipDurationMs }} class="flex-shrink-0">
					<KanbanColumnComponent
						{column}
						tasks={getTasksForColumn(column.id)}
						onUpdateColumn={(data) => handleUpdateColumn(column.id, data)}
						onDeleteColumn={() => handleDeleteColumn(column.id)}
						onTasksReorder={(taskIds) => handleTasksReorder(column.id, taskIds)}
						onTaskMove={(taskId, toColumnId, order) => handleTaskMove(taskId, toColumnId, order)}
						onAddTask={(title) => handleAddTask(column.id, title)}
					/>
				</div>
			{/each}

			<!-- Add column button -->
			<div class="flex-shrink-0">
				<AddColumnButton onAdd={handleAddColumn} />
			</div>
		</div>
	{/if}
</div>

<style>
	.kanban-board {
		min-height: 400px;
	}

	.columns-container {
		min-height: 100%;
		align-items: flex-start;
	}

	/* Hide scrollbar but keep functionality */
	.columns-container::-webkit-scrollbar {
		height: 8px;
	}

	.columns-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.columns-container::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 4px;
	}

	.columns-container::-webkit-scrollbar-thumb:hover {
		background: var(--muted-foreground);
	}
</style>
