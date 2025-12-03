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
	}

	let { task, showCompleted = false, onToggleComplete, onDelete }: Props = $props();

	// Priority colors
	const priorityColors: Record<string, string> = {
		low: 'bg-green-500',
		medium: 'bg-yellow-500',
		high: 'bg-orange-500',
		urgent: 'bg-red-500',
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
	class="task-item group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
	class:opacity-60={task.isCompleted}
>
	<!-- Priority indicator -->
	<div class="priority-indicator {priorityColors[task.priority]} h-full min-h-[40px]"></div>

	<!-- Checkbox -->
	<button
		class="task-checkbox flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-primary flex items-center justify-center mt-0.5"
		class:bg-primary={task.isCompleted}
		class:border-primary={task.isCompleted}
		onclick={onToggleComplete}
	>
		{#if task.isCompleted}
			<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<div class="flex items-start justify-between gap-2">
			<h3
				class="text-sm font-medium text-foreground truncate"
				class:line-through={task.isCompleted}
			>
				{task.title}
			</h3>

			<!-- Delete button (hidden by default, shown on hover) -->
			<button
				class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
				onclick={onDelete}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		</div>

		{#if task.description}
			<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
				{task.description}
			</p>
		{/if}

		<!-- Meta info -->
		<div class="flex items-center gap-3 mt-2 flex-wrap">
			{#if dueDateText()}
				<span
					class="text-xs flex items-center gap-1"
					class:text-red-500={isOverdue()}
					class:text-orange-500={isToday(new Date(task.dueDate || 0))}
					class:text-muted-foreground={!isOverdue() && !isToday(new Date(task.dueDate || 0))}
				>
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
				<span class="text-xs text-muted-foreground flex items-center gap-1">
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
				<div class="flex items-center gap-1">
					{#each task.labels.slice(0, 3) as label}
						<span
							class="text-xs px-1.5 py-0.5 rounded"
							style="background-color: {label.color}20; color: {label.color}"
						>
							{label.name}
						</span>
					{/each}
					{#if task.labels.length > 3}
						<span class="text-xs text-muted-foreground">+{task.labels.length - 3}</span>
					{/if}
				</div>
			{/if}

			{#if task.recurrenceRule}
				<span class="text-xs text-muted-foreground flex items-center gap-1">
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Wiederkehrend
				</span>
			{/if}
		</div>
	</div>

	<!-- Project color indicator -->
	{#if projectColor()}
		<div
			class="w-2 h-2 rounded-full flex-shrink-0"
			style="background-color: {projectColor()}"
		></div>
	{/if}
</div>
