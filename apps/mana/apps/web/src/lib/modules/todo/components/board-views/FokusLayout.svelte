<script lang="ts">
	import type { Task, TaskTag, LocalBoardView } from '../../types';
	import { groupTasksByView } from '../../view-grouping';
	import { Check, Circle, CaretRight } from '@mana/shared-icons';
	import { getPriorityColor } from '../../queries';

	interface Props {
		view: LocalBoardView;
		tasks: Task[];
		labels: TaskTag[];
		onToggleComplete: (taskId: string) => void;
		onOpenTask: (task: Task) => void;
	}

	let { view, tasks, labels, onToggleComplete, onOpenTask }: Props = $props();

	let columns = $derived(groupTasksByView(view, tasks));

	// Focus mode: show first non-empty column's first few tasks prominently
	let focusColumn = $derived(columns.find((c) => c.tasks.length > 0) ?? columns[0]);
	let focusTasks = $derived(focusColumn?.tasks.slice(0, 5) ?? []);
	let remainingColumns = $derived(columns.filter((c) => c.id !== focusColumn?.id));
</script>

<div class="space-y-6">
	<!-- Focus section -->
	{#if focusColumn}
		<div>
			<div class="mb-3 flex items-center gap-2">
				<span class="h-3 w-3 rounded-full" style="background-color: {focusColumn.color}"></span>
				<span class="text-lg font-bold text-foreground">{focusColumn.name}</span>
			</div>
			<div class="space-y-2">
				{#each focusTasks as task, i (task.id)}
					<div
						onclick={() => onOpenTask(task)}
						onkeydown={(e) => e.key === 'Enter' && onOpenTask(task)}
						role="button"
						tabindex="0"
						class="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
						style="border-left: 4px solid {getPriorityColor(task.priority)}"
					>
						<button
							onclick={(e) => {
								e.stopPropagation();
								onToggleComplete(task.id);
							}}
							class="flex-shrink-0 transition-colors {task.isCompleted
								? 'text-green-500'
								: 'text-muted-foreground hover:text-primary'}"
						>
							{#if task.isCompleted}
								<Check size={24} weight="bold" />
							{:else}
								<Circle size={24} />
							{/if}
						</button>
						<div class="min-w-0 flex-1">
							<span
								class="text-base font-medium {task.isCompleted
									? 'text-muted-foreground line-through'
									: 'text-foreground'}"
							>
								{task.title}
							</span>
							{#if task.description}
								<p class="mt-0.5 truncate text-sm text-muted-foreground">
									{task.description}
								</p>
							{/if}
						</div>
						<CaretRight
							size={16}
							class="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Remaining columns collapsed -->
	{#each remainingColumns as column (column.id)}
		{#if column.tasks.length > 0}
			<div class="rounded-lg border border-border bg-muted/20 p-3">
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 rounded-full" style="background-color: {column.color}"></span>
					<span class="text-sm font-medium text-muted-foreground">{column.name}</span>
					<span class="text-xs text-muted-foreground">({column.tasks.length})</span>
				</div>
			</div>
		{/if}
	{/each}
</div>
