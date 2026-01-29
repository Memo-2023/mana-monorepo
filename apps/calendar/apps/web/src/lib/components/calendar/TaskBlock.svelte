<script lang="ts">
	import type { Task } from '$lib/api/todos';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { _ } from 'svelte-i18n';
	import { CheckSquare, Square } from '@manacore/shared-icons';

	interface Props {
		task: Task;
		style: string;
		onTaskClick?: (task: Task) => void;
		onDragStart?: (task: Task, e: PointerEvent) => void;
		onResizeStart?: (task: Task, edge: 'top' | 'bottom', e: PointerEvent) => void;
		isDragging?: boolean;
		isResizing?: boolean;
		isDraggingSource?: boolean; // True when this is the source of a cross-day drag (shows as ghost)
	}

	let {
		task,
		style,
		onTaskClick,
		onDragStart,
		onResizeStart,
		isDragging = false,
		isResizing = false,
		isDraggingSource = false,
	}: Props = $props();

	// Priority colors
	const PRIORITY_COLORS: Record<string, string> = {
		urgent: 'hsl(0, 72%, 51%)', // red
		high: 'hsl(25, 95%, 53%)', // orange
		medium: 'hsl(48, 96%, 53%)', // yellow
		low: 'hsl(142, 71%, 45%)', // green
	};

	let priorityColor = $derived(PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium);

	async function toggleComplete(e: MouseEvent) {
		e.stopPropagation();
		await todosStore.toggleComplete(task.id);
	}

	function handleClick(e: MouseEvent) {
		// Don't trigger click if we just finished dragging
		if (isDragging || isResizing) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		onTaskClick?.(task);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onTaskClick?.(task);
		}
	}

	function handlePointerDown(e: PointerEvent) {
		// Don't allow dragging completed tasks
		if (task.isCompleted) return;
		// Don't start drag from checkbox
		if ((e.target as HTMLElement).closest('.task-checkbox')) return;
		// Don't start drag from resize handles
		if ((e.target as HTMLElement).closest('.resize-handle')) return;

		onDragStart?.(task, e);
	}

	function handleResizeTop(e: PointerEvent) {
		if (task.isCompleted) return;
		e.stopPropagation();
		onResizeStart?.(task, 'top', e);
	}

	function handleResizeBottom(e: PointerEvent) {
		if (task.isCompleted) return;
		e.stopPropagation();
		onResizeStart?.(task, 'bottom', e);
	}
</script>

<div
	class="task-block"
	class:completed={task.isCompleted}
	class:dragging={isDragging}
	class:resizing={isResizing}
	class:dragging-source={isDraggingSource}
	{style}
	role="button"
	tabindex="0"
	aria-label="{$_('todo.task')}: {task.title}"
	onclick={handleClick}
	onkeydown={handleKeydown}
	onpointerdown={handlePointerDown}
>
	<!-- Top resize handle (only for non-completed tasks) -->
	{#if onResizeStart && !task.isCompleted}
		<div
			class="resize-handle top"
			onpointerdown={handleResizeTop}
			role="slider"
			aria-label={$_('event.changeStartTime')}
			aria-valuenow={0}
			tabindex="-1"
		></div>
	{/if}

	<div class="task-priority-indicator" style="background-color: {priorityColor}"></div>

	<button
		class="task-checkbox"
		onclick={toggleComplete}
		aria-label={task.isCompleted ? $_('todo.markIncomplete') : $_('todo.markComplete')}
	>
		{#if task.isCompleted}
			<CheckSquare size={14} />
		{:else}
			<Square size={14} />
		{/if}
	</button>

	<div class="task-content">
		<span class="task-time">
			{task.scheduledStartTime || ''}
			{#if task.scheduledEndTime}
				- {task.scheduledEndTime}
			{/if}
		</span>
		<span class="task-title">{task.title}</span>
	</div>

	<!-- Bottom resize handle (only for non-completed tasks) -->
	{#if onResizeStart && !task.isCompleted}
		<div
			class="resize-handle bottom"
			onpointerdown={handleResizeBottom}
			role="slider"
			aria-label={$_('event.changeEndTime')}
			aria-valuenow={0}
			tabindex="-1"
		></div>
	{/if}
</div>

<style>
	.task-block {
		position: absolute;
		left: 2px;
		right: 2px;
		padding: 2px 4px;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: grab;
		z-index: 1;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		gap: 4px;
		transition:
			box-shadow 0.15s ease,
			opacity 0.15s ease;
		touch-action: none;
		user-select: none;
	}

	.task-block:hover {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.task-block.completed {
		background: hsl(var(--color-muted) / 0.3);
		cursor: default;
	}

	.task-block.completed .task-title {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.task-block.completed .task-checkbox {
		color: hsl(var(--color-success, 142 71% 45%));
	}

	.task-block.completed .task-priority-indicator {
		opacity: 0.4;
	}

	.task-block.dragging {
		cursor: grabbing;
		opacity: 0.9;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	.task-block.resizing {
		opacity: 0.85;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		outline: 2px dashed hsl(var(--color-primary) / 0.6);
		outline-offset: -2px;
	}

	/* Ghost style for source position during cross-day drag */
	.task-block.dragging-source {
		opacity: 0.5;
		background: transparent;
		border: 2px dashed hsl(var(--color-border));
		pointer-events: none;
	}

	.task-block.dragging-source .task-title,
	.task-block.dragging-source .task-time,
	.task-block.dragging-source .task-checkbox {
		opacity: 0.5;
	}

	.task-priority-indicator {
		width: 3px;
		min-height: 100%;
		border-radius: 2px;
		flex-shrink: 0;
		align-self: stretch;
	}

	.task-checkbox {
		flex-shrink: 0;
		padding: 0;
		margin-top: 1px;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.task-checkbox:hover {
		color: hsl(var(--color-primary));
	}

	.task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.task-time {
		font-size: 0.6rem;
		color: hsl(var(--color-muted-foreground));
		display: block;
	}

	.task-title {
		display: block;
		font-size: 0.7rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: hsl(var(--color-foreground));
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
		opacity: 0;
		transition: opacity 0.15s ease;
		z-index: 2;
	}

	.resize-handle.top {
		top: 0;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	.resize-handle.bottom {
		bottom: 0;
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	.task-block:hover .resize-handle {
		opacity: 1;
		background: hsl(var(--color-primary) / 0.2);
	}
</style>
