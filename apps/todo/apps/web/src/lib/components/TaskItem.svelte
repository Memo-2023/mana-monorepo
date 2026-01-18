<script lang="ts">
	import type { Task } from '@todo/shared';
	import { format, isToday, isPast, isTomorrow } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { ContactAvatar } from '@manacore/shared-ui';

	interface Props {
		task: Task;
		showCompleted?: boolean;
		animateComplete?: boolean;
		onToggleComplete: () => void;
		onDelete: () => void;
		onEdit?: () => void;
	}

	let {
		task,
		showCompleted = false,
		animateComplete = false,
		onToggleComplete,
		onDelete,
		onEdit,
	}: Props = $props();

	// Animation state for completing
	let isAnimatingComplete = $state(false);

	// External animation trigger
	$effect(() => {
		if (animateComplete && !task.isCompleted) {
			isAnimatingComplete = true;
		}
	});

	function handleToggleClick() {
		if (!task.isCompleted) {
			// Animate before completing
			isAnimatingComplete = true;
			setTimeout(() => {
				isAnimatingComplete = false;
				onToggleComplete();
			}, 500);
		} else {
			// Uncomplete immediately
			onToggleComplete();
		}
	}

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

<div
	class="task-item group"
	class:completed={task.isCompleted}
	class:completing={isAnimatingComplete}
>
	<!-- Drag handle -->
	<div class="drag-handle">
		<svg class="drag-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
		</svg>
	</div>

	<!-- Priority indicator -->
	<div
		class="priority-dot"
		style="background-color: {priorityColors[task.priority] || priorityColors.medium}"
	></div>

	<!-- Checkbox -->
	<button
		class="task-checkbox"
		class:checked={task.isCompleted}
		class:animating={isAnimatingComplete}
		onclick={handleToggleClick}
	>
		{#if task.isCompleted || isAnimatingComplete}
			<svg
				class="check-icon"
				class:animate-check={isAnimatingComplete}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>

	<!-- Content (clickable to edit) -->
	<button type="button" class="task-content" onclick={handleContentClick}>
		<span class="task-title" class:line-through={task.isCompleted}>
			{task.title}
		</span>

		<!-- Labels and subtasks below title -->
		{#if subtaskProgress() || (task.labels && task.labels.length > 0)}
			<div class="task-meta">
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

	<!-- Assignee and involved contacts -->
	{#if task.metadata?.assignee || (task.metadata?.involvedContacts && task.metadata.involvedContacts.length > 0)}
		<div class="contacts-display">
			{#if task.metadata?.assignee}
				<div class="assignee-avatar" title="Zuständig: {task.metadata.assignee.displayName}">
					<ContactAvatar
						name={task.metadata.assignee.displayName}
						photoUrl={task.metadata.assignee.photoUrl}
						size="xs"
					/>
				</div>
			{/if}
			{#if task.metadata?.involvedContacts && task.metadata.involvedContacts.length > 0}
				<div class="involved-avatars">
					{#each task.metadata.involvedContacts.slice(0, 2) as contact}
						<div class="involved-avatar" title="Beteiligt: {contact.displayName}">
							<ContactAvatar name={contact.displayName} photoUrl={contact.photoUrl} size="xs" />
						</div>
					{/each}
					{#if task.metadata.involvedContacts.length > 2}
						<span class="more-contacts">+{task.metadata.involvedContacts.length - 2}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Due date (always on the right) -->
	{#if dueDateText()}
		<span
			class="due-date"
			class:overdue={isOverdue()}
			class:today={task.dueDate && isToday(new Date(task.dueDate))}
		>
			{dueDateText()}
		</span>
	{/if}

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
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
		margin-bottom: 0.375rem;
	}

	:global(.dark) .task-item {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.task-item:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.12);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .task-item:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.task-item.completed {
		opacity: 0.6;
	}

	/* Completing animation */
	.task-item.completing {
		background: rgba(34, 197, 94, 0.15);
		border-color: rgba(34, 197, 94, 0.3);
	}

	:global(.dark) .task-item.completing {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
	}

	/* Drag handle */
	.drag-handle {
		cursor: grab;
		opacity: 0;
		transition: opacity 0.15s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0.125rem;
		margin-left: -0.25rem;
	}

	.task-item:hover .drag-handle {
		opacity: 0.4;
	}

	.drag-handle:hover {
		opacity: 0.7 !important;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.drag-icon {
		width: 1rem;
		height: 1rem;
		color: currentColor;
	}

	/* During drag, disable pointer events on interactive elements */
	:global([aria-grabbed='true']) .task-checkbox,
	:global([aria-grabbed='true']) .task-content,
	:global([aria-grabbed='true']) .delete-btn {
		pointer-events: none;
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

	.task-checkbox.animating {
		background: #22c55e;
		border-color: #22c55e;
		transform: scale(1.2);
	}

	.check-icon {
		width: 0.75rem;
		height: 0.75rem;
		color: white;
	}

	.check-icon.animate-check {
		animation: drawCheck 0.3s ease-out forwards;
	}

	.check-icon.animate-check path {
		stroke-dasharray: 24;
		stroke-dashoffset: 24;
		animation: drawPath 0.3s ease-out forwards;
	}

	@keyframes drawPath {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes drawCheck {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
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

	/* Contacts display */
	.contacts-display {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.assignee-avatar {
		position: relative;
	}

	.assignee-avatar::after {
		content: '';
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 6px;
		height: 6px;
		background: #8b5cf6;
		border-radius: 50%;
		border: 1px solid white;
	}

	:global(.dark) .assignee-avatar::after {
		border-color: rgba(30, 30, 30, 1);
	}

	.involved-avatars {
		display: flex;
		align-items: center;
	}

	.involved-avatar {
		margin-left: -0.375rem;
	}

	.involved-avatar:first-child {
		margin-left: 0;
	}

	.more-contacts {
		font-size: 0.625rem;
		color: #6b7280;
		margin-left: 0.25rem;
		font-weight: 500;
	}

	:global(.dark) .more-contacts {
		color: #9ca3af;
	}

	/* Due date */
	.due-date {
		font-size: 0.75rem;
		color: #6b7280;
		flex-shrink: 0;
		white-space: nowrap;
	}

	:global(.dark) .due-date {
		color: #9ca3af;
	}

	.due-date.overdue {
		color: #ef4444;
	}

	.due-date.today {
		color: #f97316;
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
