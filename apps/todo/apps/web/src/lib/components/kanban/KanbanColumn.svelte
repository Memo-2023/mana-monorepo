<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import type { KanbanColumn, Task, UpdateTaskInput } from '@todo/shared';
	import KanbanTaskCard from './KanbanTaskCard.svelte';
	import KanbanColumnHeader from './KanbanColumnHeader.svelte';
	import QuickAddTaskInline from './QuickAddTaskInline.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';

	interface Props {
		column: KanbanColumn;
		tasks: Task[];
		onUpdateColumn?: (data: { name?: string; color?: string }) => void;
		onDeleteColumn?: () => void;
		onTasksReorder?: (taskIds: string[]) => void;
		onTaskMove?: (taskId: string, toColumnId: string, order: number) => void;
		onAddTask?: (title: string) => void;
	}

	let {
		column,
		tasks,
		onUpdateColumn,
		onDeleteColumn,
		onTasksReorder,
		onTaskMove,
		onAddTask,
	}: Props = $props();

	// Local tasks state for drag and drop
	let localTasks = $state<Task[]>([]);

	// Sync with parent
	$effect(() => {
		localTasks = [...tasks];
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: Task[] }>) {
		localTasks = e.detail.items;
	}

	function handleDndFinalize(
		e: CustomEvent<{ items: Task[]; info: { id: string; source: { items: Task[] } } }>
	) {
		const newItems = e.detail.items.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		const movedTaskId = e.detail.info.id;

		// Check if this task came from another column
		const movedTask = newItems.find((t) => t.id === movedTaskId);
		const wasInThisColumn = tasks.some((t) => t.id === movedTaskId);

		if (movedTask && !wasInThisColumn) {
			// Task moved FROM another column TO this column
			const newIndex = newItems.findIndex((t) => t.id === movedTaskId);
			onTaskMove?.(movedTaskId, column.id, newIndex);
		} else {
			// Task reordered within this column
			const taskIds = newItems.map((t) => t.id);
			onTasksReorder?.(taskIds);
		}

		localTasks = newItems;
	}

	async function handleToggleComplete(task: Task) {
		if (task.isCompleted) {
			await tasksStore.uncompleteTask(task.id);
		} else {
			await tasksStore.completeTask(task.id);
		}
	}

	async function handleSaveTask(task: Task, data: UpdateTaskInput) {
		// Transform data to match updateTask API (convert null to undefined)
		const updateData: UpdateTaskInput = {};
		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description ?? undefined;
		if (data.projectId !== undefined) updateData.projectId = data.projectId;
		if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ?? undefined;
		if (data.priority !== undefined) updateData.priority = data.priority;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.subtasks !== undefined) updateData.subtasks = data.subtasks ?? undefined;
		if (data.recurrenceRule !== undefined)
			updateData.recurrenceRule = data.recurrenceRule ?? undefined;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;
		if (data.labelIds !== undefined) updateData.labelIds = data.labelIds;

		await tasksStore.updateTask(task.id, updateData);
	}

	async function handleDeleteTask(task: Task) {
		await tasksStore.deleteTask(task.id);
	}
</script>

<div class="kanban-column flex flex-col min-w-[300px] max-w-[340px] h-full">
	<!-- Header -->
	<KanbanColumnHeader
		{column}
		taskCount={localTasks.length}
		onUpdate={onUpdateColumn}
		onDelete={onDeleteColumn}
	/>

	<!-- Tasks list with drag and drop -->
	<div
		class="tasks-container flex-1 overflow-y-auto px-3 pb-3"
		use:dndzone={{
			items: localTasks,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['drop-target'],
			type: 'tasks',
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each localTasks.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID) as task (task.id)}
			<div class="mb-2.5 last:mb-0">
				<KanbanTaskCard
					{task}
					onToggleComplete={() => handleToggleComplete(task)}
					onSave={(data) => handleSaveTask(task, data)}
					onDelete={() => handleDeleteTask(task)}
				/>
			</div>
		{/each}
	</div>

	<!-- Quick Add Task -->
	{#if onAddTask}
		<div class="px-3 pb-3 pt-2">
			<QuickAddTaskInline onAdd={onAddTask} />
		</div>
	{/if}
</div>

<style>
	.kanban-column {
		min-height: 250px;
		max-height: calc(100vh - 280px);
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .kanban-column {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tasks-container {
		min-height: 80px;
	}

	/* Custom scrollbar for tasks */
	.tasks-container::-webkit-scrollbar {
		width: 6px;
	}

	.tasks-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.tasks-container::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
	}

	:global(.dark) .tasks-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
	}

	.tasks-container::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.2);
	}

	:global(.dark) .tasks-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	:global(.drop-target) {
		outline: 2px dashed #8b5cf6;
		outline-offset: -2px;
		border-radius: 1.5rem;
		background: rgba(139, 92, 246, 0.05);
	}
</style>
