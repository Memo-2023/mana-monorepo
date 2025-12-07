<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { KanbanColumn, Task } from '@todo/shared';
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
</script>

<div class="kanban-column flex flex-col bg-muted/50 rounded-xl min-w-[280px] max-w-[320px] h-full">
	<!-- Header -->
	<KanbanColumnHeader
		{column}
		taskCount={localTasks.length}
		onUpdate={onUpdateColumn}
		onDelete={onDeleteColumn}
	/>

	<!-- Tasks list with drag and drop -->
	<div
		class="flex-1 overflow-y-auto px-2 pb-2"
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
			<div animate:flip={{ duration: flipDurationMs }} class="mb-2">
				<KanbanTaskCard {task} onToggleComplete={() => handleToggleComplete(task)} />
			</div>
		{/each}

		{#if localTasks.length === 0}
			<div class="text-center py-4 text-muted-foreground text-sm">
				<p>Keine Aufgaben</p>
			</div>
		{/if}
	</div>

	<!-- Quick Add Task -->
	{#if onAddTask}
		<div class="px-2 pb-2">
			<QuickAddTaskInline onAdd={onAddTask} />
		</div>
	{/if}
</div>

<style>
	.kanban-column {
		min-height: 200px;
	}

	:global(.drop-target) {
		outline: 2px dashed var(--primary);
		outline-offset: -2px;
		border-radius: 0.5rem;
	}
</style>
