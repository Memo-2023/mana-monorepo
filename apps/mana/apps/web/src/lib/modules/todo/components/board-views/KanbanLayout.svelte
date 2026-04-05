<script lang="ts">
	import type { Task, LocalLabel, LocalBoardView } from '../../types';
	import { groupTasksByView, getDropActionUpdate } from '../../view-grouping';
	import { tasksStore } from '../../stores/tasks.svelte';
	import ViewColumn from './ViewColumn.svelte';

	interface Props {
		view: LocalBoardView;
		tasks: Task[];
		labels: LocalLabel[];
		wipLimit?: number | null;
		cardSize?: 'compact' | 'normal' | 'large';
		onToggleComplete: (taskId: string) => void;
		onSaveTask: (taskId: string, data: Partial<Task>) => void;
		onDeleteTask: (taskId: string) => void;
		onQuickAdd: (title: string, columnId: string) => void;
		onOpenTask: (task: Task) => void;
	}

	let {
		view,
		tasks,
		labels,
		wipLimit = null,
		cardSize = 'normal',
		onToggleComplete,
		onSaveTask,
		onDeleteTask,
		onQuickAdd,
		onOpenTask,
	}: Props = $props();

	let columns = $derived(groupTasksByView(view, tasks));

	// Handle drop: apply the column's drop action to the task
	async function handleDropTask(taskId: string, columnId: string) {
		const column = view.columns.find((c) => c.id === columnId);
		if (!column?.onDrop) return;

		const update = getDropActionUpdate(column.onDrop);
		if (Object.keys(update).length > 0) {
			await tasksStore.updateTask(taskId, update);
		}
	}
</script>

<div class="flex gap-3 overflow-x-auto pb-4">
	{#each columns as column (column.id)}
		<ViewColumn
			{column}
			{labels}
			{wipLimit}
			{cardSize}
			{onToggleComplete}
			{onSaveTask}
			{onDeleteTask}
			{onQuickAdd}
			{onOpenTask}
			onDropTask={handleDropTask}
		/>
	{/each}
</div>
