<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import type { Task, UpdateTaskInput } from '@todo/shared';
	import TaskItem from './TaskItem.svelte';
	import { getContext, untrack } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import {
		PencilSimple,
		CheckSquare,
		ArrowCircleUp,
		ArrowDown,
		ArrowRight,
		ArrowUp,
		Lightning,
		Trash,
	} from '@manacore/shared-icons';
	import { TodoEvents } from '@manacore/shared-utils/analytics';
	import {
		dropTarget,
		registerSvelteActionDrag,
		clearSvelteActionDrag,
	} from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';

	// Context menu state
	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextMenuTask = $state<Task | null>(null);

	function handleContextMenu(e: MouseEvent, task: Task) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuTask = task;
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		if (!contextMenuTask) return [];
		const task = contextMenuTask;

		const items: ContextMenuItem[] = [
			{
				id: 'edit',
				label: 'Bearbeiten',
				icon: PencilSimple,
				action: () => handleExpandTask(task.id),
			},
			{
				id: 'toggle-complete',
				label: task.isCompleted ? 'Als offen markieren' : 'Als erledigt markieren',
				icon: task.isCompleted ? ArrowCircleUp : CheckSquare,
				action: () => handleToggleComplete(task),
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'priority-low',
				label: 'Niedrig',
				icon: ArrowDown,
				action: () => handleSetPriority(task.id, 'low'),
				disabled: task.priority === 'low',
			},
			{
				id: 'priority-medium',
				label: 'Mittel',
				icon: ArrowRight,
				action: () => handleSetPriority(task.id, 'medium'),
				disabled: task.priority === 'medium',
			},
			{
				id: 'priority-high',
				label: 'Hoch',
				icon: ArrowUp,
				action: () => handleSetPriority(task.id, 'high'),
				disabled: task.priority === 'high',
			},
			{
				id: 'priority-urgent',
				label: 'Dringend',
				icon: Lightning,
				action: () => handleSetPriority(task.id, 'urgent'),
				disabled: task.priority === 'urgent',
			},
		];

		items.push({ id: 'divider-2', label: '', type: 'divider' });
		items.push({
			id: 'delete',
			label: 'Löschen',
			icon: Trash,
			variant: 'danger',
			action: () => handleDelete(task.id),
		});

		return items;
	}

	async function handleSetPriority(taskId: string, priority: string) {
		await tasksStore.updateTask(taskId, { priority: priority as Task['priority'] });
		TodoEvents.priorityChanged(priority);
	}

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
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	}

	// Local mutable state for dnd-zone
	let items = $state<Task[]>([]);

	// Track which task is being animated for completion
	let animatingTaskId = $state<string | null>(null);

	// After a drop, ignore external syncs until the timeout clears
	let dropInProgress = false;

	// Sync items with tasks prop — but preserve local order during/after DnD
	$effect(() => {
		// Subscribe to tasks (the reactive dependency)
		const currentTasks = tasks;

		// Read items without subscribing to avoid infinite loop
		untrack(() => {
			const taskIds = new Set(currentTasks.map((t) => t.id));
			const itemIds = new Set(items.map((t) => t.id));

			// Check if the actual set of IDs changed (task added or removed)
			const idsChanged =
				taskIds.size !== itemIds.size ||
				currentTasks.some((t) => !itemIds.has(t.id)) ||
				items.some((t) => !taskIds.has(t.id));

			if (idsChanged) {
				// Real structural change — full resync
				items = [...currentTasks];
				dropInProgress = false;
			} else if (!dropInProgress) {
				// Same IDs — update task data in current order (no reorder flicker)
				const taskMap = new Map(currentTasks.map((t) => [t.id, t]));
				items = items.map((item) => taskMap.get(item.id) || item);
			}
		});
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: Task[]; info: { id: string } }>) {
		items = e.detail.items;
		// Inform passive drop zones that a task is being dragged
		registerSvelteActionDrag({
			type: 'task',
			data: { id: e.detail.info.id, title: '' },
		});
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
		} else if (wasInThisList) {
			// Task reordered within this list - persist the new order
			const taskIds = newItems.map((t) => t.id);
			tasksStore.reorderTasks(taskIds);
		}

		// Update local state and block sync from reverting order
		items = newItems;
		dropInProgress = true;
		setTimeout(() => {
			dropInProgress = false;
		}, 1000);

		// Clear passive drop zone state
		clearSvelteActionDrag();
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

	// ── DnD Layer 1: handle tag dropped onto a task ─────────
	function handleTagDrop(task: Task, payload: DragPayload) {
		const tagData = payload.data as TagDragData;
		const currentLabels: string[] = (task.metadata as { labelIds?: string[] })?.labelIds ?? [];
		if (!currentLabels.includes(tagData.id)) {
			tasksStore.updateLabels(task.id, [...currentLabels, tagData.id]);
		}
	}

	function tagNotAlreadyOnTask(task: Task) {
		return (payload: DragPayload) => {
			const tagData = payload.data as TagDragData;
			const currentLabels: string[] = (task.metadata as { labelIds?: string[] })?.labelIds ?? [];
			return !currentLabels.includes(tagData.id);
		};
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
			dropTargetClasses: [],
			type: 'homepage-tasks',
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each items as task (task.id)}
			{#if task.id === SHADOW_PLACEHOLDER_ITEM_ID}
				<div class="dnd-shadow-placeholder"></div>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					oncontextmenu={(e) => handleContextMenu(e, task)}
					use:dropTarget={{
						accepts: ['tag'],
						onDrop: (payload) => handleTagDrop(task, payload),
						canDrop: tagNotAlreadyOnTask(task),
					}}
				>
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
				</div>
			{/if}
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
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				oncontextmenu={(e) => handleContextMenu(e, task)}
				use:dropTarget={{
					accepts: ['tag'],
					onDrop: (payload) => handleTagDrop(task, payload),
					canDrop: tagNotAlreadyOnTask(task),
				}}
			>
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
			</div>
		{/each}
	</div>
{/if}

<ContextMenu
	visible={contextMenuVisible}
	x={contextMenuX}
	y={contextMenuY}
	items={getContextMenuItems()}
	onClose={() => {
		contextMenuVisible = false;
		contextMenuTask = null;
	}}
/>

<style>
	.task-list {
		min-height: 2.5rem;
		padding: 0;
		border-radius: 0;
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

	/* Dragged item styling */
	:global([aria-grabbed='true']) {
		opacity: 0.9;
		transform: scale(1.02);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		z-index: 100;
	}

	:global(.dark [aria-grabbed='true']) {
		background: rgba(40, 40, 40, 0.95);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	}

	.dnd-shadow-placeholder {
		min-height: 2.5rem;
	}

	/* Shadow placeholder (where dragged item will land) */
	:global(.task-list [data-is-dnd-shadow-item-hint]) {
		background: rgba(139, 92, 246, 0.06);
		border-radius: 0.375rem;
		border: 1px dashed rgba(139, 92, 246, 0.3);
		visibility: visible !important;
	}

	:global(.dark .task-list [data-is-dnd-shadow-item-hint]) {
		background: rgba(139, 92, 246, 0.1);
		border-color: rgba(139, 92, 246, 0.4);
	}

	/* Tag-on-Task drop target hover */
	:global(.mana-drop-target-hover) {
		outline: 2px solid var(--color-primary, #8b5cf6);
		outline-offset: -2px;
		border-radius: 0.375rem;
		background: rgba(139, 92, 246, 0.06);
		transition: all 0.15s ease;
	}

	:global(.dark .mana-drop-target-hover) {
		background: rgba(139, 92, 246, 0.12);
	}

	/* Brief success pulse after tag assigned */
	:global(.mana-drop-target-success) {
		animation: drop-success-pulse 400ms ease-out;
	}

	@keyframes drop-success-pulse {
		0% {
			outline-color: #10b981;
			background: rgba(16, 185, 129, 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
