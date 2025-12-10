<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import type { Task } from '@todo/shared';
	import TaskItem from './TaskItem.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';

	interface Props {
		tasks: Task[];
		showCompleted?: boolean;
		enableDragDrop?: boolean;
		dropTargetDate?: Date | 'completed' | 'overdue';
		onEditTask?: (task: Task) => void;
		onTaskDrop?: (taskId: string, targetDate: Date | 'completed' | 'overdue') => void;
	}

	let {
		tasks,
		showCompleted = false,
		enableDragDrop = false,
		dropTargetDate,
		onEditTask,
		onTaskDrop,
	}: Props = $props();

	// Local mutable state for dnd-zone
	let items = $state<Task[]>([]);

	// Track which task is being animated for completion
	let animatingTaskId = $state<string | null>(null);

	// Create a stable key from task IDs to detect real changes
	let lastTaskIds = '';

	// Sync items with tasks only when the set of task IDs changes
	$effect(() => {
		const currentIds = tasks
			.map((t) => t.id)
			.sort()
			.join(',');
		if (currentIds !== lastTaskIds) {
			items = [...tasks];
			lastTaskIds = currentIds;
		}
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: Task[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: Task[]; info: { id: string } }>) {
		const newItems = e.detail.items.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		const movedTaskId = e.detail.info.id;

		// Check if this task came from another list (dropped INTO this list)
		const wasInThisList = tasks.some((t) => t.id === movedTaskId);

		if (!wasInThisList && dropTargetDate && onTaskDrop) {
			// If dropping into completed section, animate first
			if (dropTargetDate === 'completed') {
				animatingTaskId = movedTaskId;
				setTimeout(() => {
					animatingTaskId = null;
					onTaskDrop(movedTaskId, dropTargetDate);
				}, 500);
			} else {
				// Task moved FROM another section TO this section
				onTaskDrop(movedTaskId, dropTargetDate);
			}
		}

		// Update local state and sync lastTaskIds to prevent $effect from reverting
		items = newItems;
		lastTaskIds = newItems
			.map((t) => t.id)
			.sort()
			.join(',');
	}

	async function handleToggleComplete(task: Task) {
		if (task.isCompleted) {
			await tasksStore.uncompleteTask(task.id);
		} else {
			await tasksStore.completeTask(task.id);
		}
	}

	async function handleDelete(taskId: string) {
		await tasksStore.deleteTask(taskId);
	}
</script>

{#if enableDragDrop}
	<div
		class="task-list"
		class:empty={items.length === 0}
		use:dndzone={{
			items,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['task-drop-target'],
			type: 'homepage-tasks',
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each items.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID) as task (task.id)}
			<TaskItem
				{task}
				{showCompleted}
				animateComplete={animatingTaskId === task.id}
				onToggleComplete={() => handleToggleComplete(task)}
				onDelete={() => handleDelete(task.id)}
				onEdit={onEditTask ? () => onEditTask(task) : undefined}
			/>
		{/each}
		{#if items.length === 0}
			<div class="empty-placeholder">
				<span>Aufgabe hierher ziehen</span>
			</div>
		{/if}
	</div>
{:else}
	<div class="task-list">
		{#each tasks as task (task.id)}
			<TaskItem
				{task}
				{showCompleted}
				animateComplete={animatingTaskId === task.id}
				onToggleComplete={() => handleToggleComplete(task)}
				onDelete={() => handleDelete(task.id)}
				onEdit={onEditTask ? () => onEditTask(task) : undefined}
			/>
		{/each}
	</div>
{/if}

<style>
	.task-list {
		min-height: 60px;
		padding: 0.25rem;
		border-radius: 0.5rem;
		transition: background-color 0.15s ease;
	}

	.task-list.empty {
		border: 2px dashed rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.dark) .task-list.empty {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.empty-placeholder {
		color: var(--color-muted-foreground, #9ca3af);
		font-size: 0.875rem;
		padding: 1rem;
		text-align: center;
		opacity: 0.5;
	}

	:global(.task-drop-target) {
		outline: 2px dashed #8b5cf6 !important;
		outline-offset: -2px;
		background: rgba(139, 92, 246, 0.08) !important;
	}

	:global(.task-drop-target) .empty-placeholder {
		opacity: 0;
	}

	:global(.dark .task-drop-target) {
		background: rgba(139, 92, 246, 0.15) !important;
	}
</style>
