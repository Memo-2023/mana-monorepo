<script lang="ts">
	import type { Task } from '@todo/shared';
	import { format, isToday, isPast, isTomorrow } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		task: Task;
		onToggleComplete?: () => void;
	}

	let { task, onToggleComplete }: Props = $props();

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

	// Subtasks progress
	let subtaskProgress = $derived(() => {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const completed = task.subtasks.filter((s) => s.isCompleted).length;
		return `${completed}/${task.subtasks.length}`;
	});
</script>

<div
	class="kanban-card group bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
	class:opacity-60={task.isCompleted}
>
	<!-- Priority indicator -->
	<div class="flex items-start gap-2">
		<div
			class="priority-dot {priorityColors[task.priority]} w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
		></div>

		<div class="flex-1 min-w-0">
			<!-- Title -->
			<h4
				class="text-sm font-medium text-foreground line-clamp-2"
				class:line-through={task.isCompleted}
			>
				{task.title}
			</h4>

			<!-- Meta info -->
			{#if dueDateText() || subtaskProgress() || (task.labels && task.labels.length > 0)}
				<div class="flex items-center gap-2 mt-2 flex-wrap">
					{#if dueDateText()}
						<span
							class="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded {isOverdue()
								? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
								: 'bg-muted text-muted-foreground'}"
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
						<span
							class="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded"
						>
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
							{#each task.labels.slice(0, 2) as label}
								<span
									class="w-4 h-1.5 rounded-full"
									style="background-color: {label.color}"
									title={label.name}
								></span>
							{/each}
							{#if task.labels.length > 2}
								<span class="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Complete button -->
		{#if onToggleComplete}
			<button
				class="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-primary flex items-center justify-center transition-opacity"
				class:bg-primary={task.isCompleted}
				class:border-primary={task.isCompleted}
				onclick={onToggleComplete}
			>
				{#if task.isCompleted}
					<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{/if}
			</button>
		{/if}
	</div>
</div>

<style>
	.kanban-card {
		user-select: none;
	}
</style>
