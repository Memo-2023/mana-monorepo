<script lang="ts">
	import type { Task } from '@todo/shared';
	import { format, isToday, isPast, isTomorrow } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { projectsStore } from '$lib/stores/projects.svelte';

	interface Props {
		task: Task;
		showCompleted?: boolean;
		onToggleComplete: () => void;
		onDelete: () => void;
		onEdit?: () => void;
	}

	let { task, showCompleted = false, onToggleComplete, onDelete, onEdit }: Props = $props();

	function handleContentClick() {
		if (onEdit) {
			onEdit();
		}
	}

	// Priority colors
	const priorityColors: Record<string, string> = {
		low: '#22c55e',
		medium: '#eab308',
		high: '#f97316',
		urgent: '#ef4444',
	};

	// Format due date
	let dueDateText = $derived(() => {
		if (!task.dueDate) return null;
		const date = new Date(task.dueDate);
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'dd. MMM', { locale: de });
	});

	// Check if overdue
	let isOverdue = $derived(() => {
		if (!task.dueDate || task.isCompleted) return false;
		const date = new Date(task.dueDate);
		return isPast(date) && !isToday(date);
	});

	// Get project color
	let projectColor = $derived(() => {
		if (!task.projectId) return null;
		return projectsStore.getColor(task.projectId);
	});

	// Subtasks progress
	let subtaskProgress = $derived(() => {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const completed = task.subtasks.filter((s) => s.isCompleted).length;
		return `${completed}/${task.subtasks.length}`;
	});
</script>

<div class="task-item group" class:completed={task.isCompleted}>
	<!-- Priority indicator -->
	<div
		class="priority-dot"
		style="background-color: {priorityColors[task.priority] || priorityColors.medium}"
	></div>

	<!-- Checkbox -->
	<button class="task-checkbox" class:checked={task.isCompleted} onclick={onToggleComplete}>
		{#if task.isCompleted}
			<svg class="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>

	<!-- Content (clickable to edit) -->
	<button type="button" class="task-content" onclick={handleContentClick}>
		<span class="task-title" class:line-through={task.isCompleted}>
			{task.title}
		</span>

		<!-- Meta info inline -->
		{#if dueDateText() || subtaskProgress() || (task.labels && task.labels.length > 0)}
			<div class="task-meta">
				{#if dueDateText()}
					<span
						class="meta-item date"
						class:overdue={isOverdue()}
						class:today={isToday(new Date(task.dueDate || 0))}
					>
						<svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						{dueDateText()}
					</span>
				{/if}

				{#if subtaskProgress()}
					<span class="meta-item">
						<svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							/>
						</svg>
						{subtaskProgress()}
					</span>
				{/if}

				{#if task.labels && task.labels.length > 0}
					{#each task.labels.slice(0, 2) as label}
						<span class="label-tag" style="--label-color: {label.color}">
							{label.name}
						</span>
					{/each}
					{#if task.labels.length > 2}
						<span class="meta-item">+{task.labels.length - 2}</span>
					{/if}
				{/if}
			</div>
		{/if}
	</button>

	<!-- Project indicator -->
	{#if projectColor()}
		<div class="project-dot" style="background-color: {projectColor()}"></div>
	{/if}

	<!-- Delete button -->
	<button class="delete-btn" onclick={onDelete}>
		<svg class="delete-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
</div>

<style>
	.task-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: all 0.2s;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .task-item {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.task-item:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .task-item:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.task-item.completed {
		opacity: 0.6;
	}

	/* Priority dot */
	.priority-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Checkbox */
	.task-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	:global(.dark) .task-checkbox {
		border-color: rgba(255, 255, 255, 0.3);
	}

	.task-checkbox:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
	}

	.task-checkbox.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.check-icon {
		width: 0.75rem;
		height: 0.75rem;
		color: white;
	}

	/* Content */
	.task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	.task-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .task-title {
		color: #f3f4f6;
	}

	.task-title.line-through {
		text-decoration: line-through;
		color: #9ca3af;
	}

	/* Meta info */
	.task-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	:global(.dark) .meta-item {
		color: #9ca3af;
	}

	.meta-item.date.overdue {
		color: #ef4444;
	}

	.meta-item.date.today {
		color: #f97316;
	}

	.meta-icon {
		width: 0.75rem;
		height: 0.75rem;
	}

	.label-tag {
		font-size: 0.625rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		color: var(--label-color);
		font-weight: 500;
	}

	/* Project dot */
	.project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Delete button */
	.delete-btn {
		opacity: 0;
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.task-item:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.delete-icon {
		width: 1rem;
		height: 1rem;
	}
</style>
