<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import type { Task } from '@todo/shared';
	import type { GroupedColumn } from '$lib/data/view-grouping';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';
	import QuickAddTaskInline from '../kanban/QuickAddTaskInline.svelte';
	import ViewColumnHeader from './ViewColumnHeader.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';

	interface Props {
		column: GroupedColumn;
		columnIndex?: number;
		totalColumns?: number;
		onTaskDrop: (taskId: string, columnId: string) => void;
		onTaskToggle: (task: Task) => void;
		onTaskDelete: (taskId: string) => void;
		onTaskUpdate: (taskId: string, data: Partial<Task>) => void;
		onColumnRename?: (name: string) => void;
		onColumnColorChange?: (color: string) => void;
		onColumnMove?: (dir: -1 | 1) => void;
		onColumnDelete?: () => void;
	}

	let {
		column,
		columnIndex = 0,
		totalColumns = 1,
		onTaskDrop,
		onTaskToggle,
		onTaskDelete,
		onTaskUpdate,
		onColumnRename,
		onColumnColorChange,
		onColumnMove,
		onColumnDelete,
	}: Props = $props();

	// Local tasks state for drag and drop
	let localTasks = $state<Task[]>([]);

	// Sync with parent when column tasks change
	$effect(() => {
		localTasks = [...column.tasks];
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<DndEvent<Task>>) {
		localTasks = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Task>>) {
		const newItems = e.detail.items.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		const movedTaskId = e.detail.info.id;

		// Check if this task came from another column
		const wasInThisColumn = column.tasks.some((t) => t.id === movedTaskId);

		if (!wasInThisColumn) {
			// Task moved FROM another column TO this column
			onTaskDrop(movedTaskId, column.id);
		} else {
			// Task reordered within this column — update order
			const taskIds = newItems.map((t) => t.id);
			tasksStore.reorderTasks(taskIds);
		}

		localTasks = newItems;
	}

	function handleToggleComplete(task: Task) {
		onTaskToggle(task);
	}

	function handleSaveTask(task: Task, data: Partial<Task>) {
		const updateData: Record<string, unknown> = {};
		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.dueDate !== undefined) {
			updateData.dueDate = data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate;
		}
		if (data.priority !== undefined) updateData.priority = data.priority;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.subtasks !== undefined) updateData.subtasks = data.subtasks;
		if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;
		if (data.labels !== undefined) updateData.labelIds = data.labels?.map((l) => l.id);

		onTaskUpdate(task.id, data);
	}

	function handleDeleteTask(task: Task) {
		onTaskDelete(task.id);
	}

	async function handleAddTask(title: string) {
		// Create task with properties that match this column's onDrop action
		const createData: Record<string, unknown> = { title };
		if (column.onDrop) {
			if (column.onDrop.setCompleted !== undefined) {
				// Don't create completed tasks — create as pending
			}
			if (column.onDrop.setPriority) {
				createData.priority = column.onDrop.setPriority;
			}
		}
		await tasksStore.createTask(
			createData as {
				title: string;
				priority?: 'low' | 'medium' | 'high' | 'urgent';
			}
		);
	}
</script>

<div class="view-column flex flex-col">
	<!-- Header -->
	<ViewColumnHeader
		name={column.name}
		color={column.color}
		taskCount={localTasks.length}
		{columnIndex}
		{totalColumns}
		onRename={onColumnRename}
		onColorChange={onColumnColorChange}
		onMove={onColumnMove}
		onDelete={onColumnDelete}
	/>

	<!-- Tasks list with drag and drop -->
	<div
		class="tasks-container flex-1 overflow-y-auto px-3 pb-3"
		use:dndzone={{
			items: localTasks,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['drop-target'],
			type: 'task-dnd',
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
	<div class="px-3 pb-3 pt-2">
		<QuickAddTaskInline onAdd={handleAddTask} />
	</div>
</div>

<style>
	.view-column {
		min-height: 250px;
		max-height: calc(100vh - 280px);
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .view-column {
		background: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
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
		background: var(--color-border);
		border-radius: 3px;
	}

	.tasks-container::-webkit-scrollbar-thumb:hover {
		background: var(--color-muted-foreground);
	}

	:global(.drop-target) {
		outline: 2px dashed var(--color-primary);
		outline-offset: -2px;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--color-primary) 4%, transparent);
	}
</style>
