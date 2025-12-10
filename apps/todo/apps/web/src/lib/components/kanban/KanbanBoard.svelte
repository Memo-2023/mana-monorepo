<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import type { KanbanColumn, Task, TaskPriority } from '@todo/shared';
	import KanbanColumnComponent from './KanbanColumn.svelte';
	import AddColumnButton from './AddColumnButton.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import { KanbanBoardSkeleton } from '$lib/components/skeletons';

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
		const boardId = kanbanStore.currentBoardId;
		if (!boardId) {
			console.error('No board selected');
			return;
		}
		await kanbanStore.createColumn({ name, boardId });
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
		// Get projectId from current board if available
		const currentBoard = kanbanStore.currentBoard;
		const taskProjectId = currentBoard?.projectId ?? projectId;
		await kanbanStore.createTaskInColumn(columnId, title, taskProjectId ?? undefined);
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
		<KanbanBoardSkeleton />
	{:else if kanbanStore.error}
		<div
			class="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 flex items-center gap-3"
		>
			<svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{kanbanStore.error}</span>
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
				<div class="flex-shrink-0">
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
		scroll-behavior: smooth;
		padding-left: 1rem;
		padding-right: 1rem;
	}

	/* Extra space after last column for better scroll experience */
	.columns-container::after {
		content: '';
		flex-shrink: 0;
		width: 1rem;
	}

	@media (min-width: 640px) {
		.columns-container {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}
		.columns-container::after {
			width: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.columns-container {
			padding-left: 2rem;
			padding-right: 2rem;
		}
		.columns-container::after {
			width: 2rem;
		}
	}

	/* Styled scrollbar */
	.columns-container::-webkit-scrollbar {
		height: 10px;
	}

	.columns-container::-webkit-scrollbar-track {
		background: var(--muted);
		border-radius: 5px;
	}

	.columns-container::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 5px;
		border: 2px solid var(--muted);
	}

	.columns-container::-webkit-scrollbar-thumb:hover {
		background: var(--muted-foreground);
	}
</style>
