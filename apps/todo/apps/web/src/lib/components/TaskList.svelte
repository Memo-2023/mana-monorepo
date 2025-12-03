<script lang="ts">
	import type { Task } from '@todo/shared';
	import TaskItem from './TaskItem.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';

	interface Props {
		tasks: Task[];
		showCompleted?: boolean;
	}

	let { tasks, showCompleted = false }: Props = $props();

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
</script>

<div class="task-list space-y-2">
	{#each tasks as task (task.id)}
		<TaskItem
			{task}
			{showCompleted}
			onToggleComplete={() => handleToggleComplete(task)}
			onDelete={() => handleDelete(task.id)}
		/>
	{/each}
</div>
