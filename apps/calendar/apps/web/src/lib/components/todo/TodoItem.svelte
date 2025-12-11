<script lang="ts">
	import type { Task } from '$lib/api/todos';
	import { PRIORITY_COLORS } from '$lib/api/todos';
	import { todosStore } from '$lib/stores/todos.svelte';
	import TodoCheckbox from './TodoCheckbox.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		task: Task;
		variant?: 'default' | 'compact' | 'minimal';
		showProject?: boolean;
		showDueDate?: boolean;
		showPriority?: boolean;
		draggable?: boolean;
		onclick?: () => void;
	}

	let {
		task,
		variant = 'default',
		showProject = true,
		showDueDate = true,
		showPriority = true,
		draggable = false,
		onclick,
	}: Props = $props();

	let isToggling = $state(false);

	const priorityColor = $derived(PRIORITY_COLORS[task.priority]);

	const dueDateLabel = $derived.by(() => {
		if (!task.dueDate) return null;

		const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;

		if (isToday(date)) {
			return task.dueTime ? `Heute, ${task.dueTime}` : 'Heute';
		}
		if (isTomorrow(date)) {
			return task.dueTime ? `Morgen, ${task.dueTime}` : 'Morgen';
		}
		if (isPast(startOfDay(date)) && !task.isCompleted) {
			return format(date, 'd. MMM', { locale: de });
		}
		return format(date, 'd. MMM', { locale: de });
	});

	const isOverdue = $derived.by(() => {
		if (!task.dueDate || task.isCompleted) return false;
		const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
		return isPast(startOfDay(date)) && !isToday(date);
	});

	const subtaskProgress = $derived.by(() => {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const completed = task.subtasks.filter((s) => s.isCompleted).length;
		return { completed, total: task.subtasks.length };
	});

	async function handleToggle(checked: boolean) {
		isToggling = true;
		await todosStore.toggleComplete(task.id);
		isToggling = false;
	}

	function handleClick(e: MouseEvent) {
		// Don't trigger onclick when clicking checkbox
		if ((e.target as HTMLElement).closest('.todo-checkbox')) return;
		onclick?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && onclick) {
			onclick();
		}
	}

	function handleDragStart(e: DragEvent) {
		if (!draggable || !e.dataTransfer) return;
		// Store task data for drop target
		e.dataTransfer.setData(
			'application/json',
			JSON.stringify({
				type: 'sidebar-task',
				taskId: task.id,
				title: task.title,
				priority: task.priority,
				estimatedDuration: task.estimatedDuration || 30,
			})
		);
		e.dataTransfer.effectAllowed = 'move';
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="todo-item"
	class:completed={task.isCompleted}
	class:overdue={isOverdue}
	class:compact={variant === 'compact'}
	class:minimal={variant === 'minimal'}
	class:clickable={!!onclick}
	class:draggable-task={draggable}
	style="--priority-color: {priorityColor};"
	onclick={handleClick}
	onkeydown={handleKeydown}
	ondragstart={handleDragStart}
	draggable={draggable ? 'true' : 'false'}
	role={onclick ? 'button' : 'listitem'}
	tabindex={onclick ? 0 : -1}
>
	<TodoCheckbox
		checked={task.isCompleted}
		loading={isToggling}
		size={variant === 'minimal' ? 'sm' : 'md'}
		onchange={handleToggle}
	/>

	<div class="todo-content">
		<div class="todo-main">
			{#if showPriority && variant !== 'minimal'}
				<PriorityBadge
					priority={task.priority}
					variant="dot"
					size={variant === 'compact' ? 'sm' : 'md'}
				/>
			{/if}

			<span class="todo-title">{task.title}</span>

			{#if subtaskProgress && variant === 'default'}
				<span class="subtask-count">
					{subtaskProgress.completed}/{subtaskProgress.total}
				</span>
			{/if}
		</div>

		{#if variant !== 'minimal'}
			<div class="todo-meta">
				{#if showDueDate && dueDateLabel}
					<span class="due-date" class:overdue={isOverdue}>
						{dueDateLabel}
					</span>
				{/if}

				{#if showProject && task.project}
					<span class="project" style="--project-color: {task.project.color};">
						{task.project.name}
					</span>
				{/if}

				{#if task.labels && task.labels.length > 0 && variant === 'default'}
					<div class="labels">
						{#each task.labels.slice(0, 2) as label}
							<span class="label" style="--label-color: {label.color};">
								{label.name}
							</span>
						{/each}
						{#if task.labels.length > 2}
							<span class="label-more">+{task.labels.length - 2}</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.todo-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-md);
		background: hsl(var(--color-surface));
		border-left: 3px solid var(--priority-color);
		transition: all 150ms ease;
	}

	.todo-item.clickable {
		cursor: pointer;
	}

	.todo-item.clickable:hover {
		background: hsl(var(--color-muted) / 0.5);
		transform: translateX(2px);
	}

	.todo-item.draggable-task {
		cursor: grab;
	}

	.todo-item.draggable-task:active {
		cursor: grabbing;
		opacity: 0.7;
	}

	.todo-item.completed {
		opacity: 0.6;
	}

	.todo-item.completed .todo-title {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.todo-item.overdue {
		background: hsl(var(--color-danger) / 0.05);
	}

	/* Compact variant */
	.todo-item.compact {
		padding: 0.5rem 0.625rem;
		gap: 0.5rem;
		border-left-width: 2px;
	}

	/* Minimal variant */
	.todo-item.minimal {
		padding: 0.375rem 0.5rem;
		gap: 0.375rem;
		border-left-width: 2px;
		background: transparent;
	}

	.todo-item.minimal:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	.todo-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.todo-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.todo-title {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.compact .todo-title {
		font-size: 0.8125rem;
	}

	.minimal .todo-title {
		font-size: 0.75rem;
	}

	.subtask-count {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.5);
		padding: 1px 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.todo-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.due-date {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.due-date.overdue {
		color: hsl(var(--color-danger));
		font-weight: 500;
	}

	.project {
		font-size: 0.6875rem;
		color: var(--project-color);
		background: color-mix(in srgb, var(--project-color) 15%, transparent);
		padding: 1px 6px;
		border-radius: 4px;
	}

	.labels {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.625rem;
		color: var(--label-color);
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.label-more {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
