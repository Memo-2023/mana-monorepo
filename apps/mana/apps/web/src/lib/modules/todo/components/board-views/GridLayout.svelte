<script lang="ts">
	import type { Task, TaskTag, LocalBoardView } from '../../types';
	import { groupTasksByView } from '../../view-grouping';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';

	interface Props {
		view: LocalBoardView;
		tasks: Task[];
		labels: TaskTag[];
		onToggleComplete: (taskId: string) => void;
		onSaveTask: (taskId: string, data: Partial<Task>) => void;
		onDeleteTask: (taskId: string) => void;
		onOpenTask: (task: Task) => void;
	}

	let { view, tasks, labels, onToggleComplete, onSaveTask, onDeleteTask, onOpenTask }: Props =
		$props();

	let columns = $derived(groupTasksByView(view, tasks));
</script>

<div class="space-y-6">
	{#each columns as column (column.id)}
		<div>
			<div class="mb-2 flex items-center gap-2">
				<span class="h-2.5 w-2.5 rounded-full" style="background-color: {column.color}"></span>
				<span class="text-sm font-semibold text-foreground">{column.name}</span>
				<span class="text-xs text-muted-foreground">({column.tasks.length})</span>
			</div>
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each column.tasks as task (task.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div onclick={() => onOpenTask(task)} class="cursor-pointer">
						<KanbanTaskCard
							{task}
							{labels}
							onToggleComplete={() => onToggleComplete(task.id)}
							onSave={(data) => onSaveTask(task.id, data)}
							onDelete={() => onDeleteTask(task.id)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
