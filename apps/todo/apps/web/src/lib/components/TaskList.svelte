<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import type { Task, UpdateTaskInput } from '@todo/shared';
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

	// Track which task is expanded for inline editing
	let expandedTaskId = $state<string | null>(null);

	function handleExpandTask(taskId: string) {
		// Toggle - if same task clicked, collapse it
		if (expandedTaskId === taskId) {
			expandedTaskId = null;
		} else {
			expandedTaskId = taskId;
		}
	}

	function handleCollapseTask() {
		expandedTaskId = null;
	}

	async function handleSaveTask(taskId: string, data: UpdateTaskInput) {
		try {
			// Update task
			const updateData = {
				...data,
				metadata: data.metadata as { [key: string]: unknown } | null | undefined,
			};
			await tasksStore.updateTask(taskId, updateData);

			// Update labels if provided
			if (data.labelIds !== undefined) {
				await tasksStore.updateLabels(taskId, data.labelIds);
			}

			// Collapse after save
			expandedTaskId = null;
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	}

	// Local mutable state for dnd-zone
	let items = $state<Task[]>([]);

	// Track which task is being animated for completion
	let animatingTaskId = $state<string | null>(null);

	// Create a stable key from task IDs and updatedAt to detect real changes
	let lastTaskKey = '';

	// Sync items with tasks when IDs change OR when tasks are updated
	$effect(() => {
		// Include updatedAt in the key to detect task updates
		const currentKey = tasks
			.map((t) => `${t.id}:${t.updatedAt || ''}`)
			.sort()
			.join(',');
		if (currentKey !== lastTaskKey) {
			items = [...tasks];
			lastTaskKey = currentKey;
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

		// Update local state and sync lastTaskKey to prevent $effect from reverting
		items = newItems;
		lastTaskKey = newItems
			.map((t) => `${t.id}:${t.updatedAt || ''}`)
			.sort()
			.join(',');
	}

	async function handleToggleComplete(task: Task) {
		let result;
		if (task.isCompleted) {
			result = await tasksStore.uncompleteTask(task.id);
		} else {
			result = await tasksStore.completeTask(task.id);
		}

		// Show auth gate if authentication required (demo mode)
		if (result && 'error' in result && result.error === 'auth_required') {
			window.dispatchEvent(new CustomEvent('show-auth-gate'));
		}
	}

	async function handleDelete(taskId: string) {
		const result = await tasksStore.deleteTask(taskId);

		// Show auth gate if authentication required (demo mode)
		if (result && 'error' in result && result.error === 'auth_required') {
			window.dispatchEvent(new CustomEvent('show-auth-gate'));
		}
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
				isExpanded={expandedTaskId === task.id}
				onToggleComplete={() => handleToggleComplete(task)}
				onDelete={() => handleDelete(task.id)}
				onExpand={() => handleExpandTask(task.id)}
				onCollapse={handleCollapseTask}
				onSave={(data) => handleSaveTask(task.id, data)}
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
				isExpanded={expandedTaskId === task.id}
				onToggleComplete={() => handleToggleComplete(task)}
				onDelete={() => handleDelete(task.id)}
				onExpand={() => handleExpandTask(task.id)}
				onCollapse={handleCollapseTask}
				onSave={(data) => handleSaveTask(task.id, data)}
			/>
		{/each}
	</div>
{/if}

<style>
	.task-list {
		min-height: 60px;
		padding: 0;
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
