<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import type { Task } from '$lib/api/todos';
	import { PRIORITY_COLORS } from '$lib/api/todos';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoDetailModal from '$lib/components/todo/TodoDetailModal.svelte';

	interface Props {
		date: Date;
		maxVisible?: number;
	}

	let { date, maxVisible = 2 }: Props = $props();

	let selectedTask = $state<Task | null>(null);
	let togglingIds = $state<Set<string>>(new Set());

	const todosForDay = $derived(todosStore.getTodosForDay(date));
	const visibleTodos = $derived(todosForDay.slice(0, maxVisible));
	const overflowCount = $derived(Math.max(0, todosForDay.length - maxVisible));

	async function handleToggle(task: Task, e: MouseEvent) {
		e.stopPropagation();
		togglingIds = new Set([...togglingIds, task.id]);
		await todosStore.toggleComplete(task.id);
		togglingIds = new Set([...togglingIds].filter((id) => id !== task.id));
	}

	function handleTaskClick(task: Task) {
		selectedTask = task;
	}

	function handleModalClose() {
		selectedTask = null;
	}
</script>

{#if todosForDay.length > 0}
	<div class="todo-day-cell">
		{#each visibleTodos as task (task.id)}
			<button
				type="button"
				class="todo-cell-item"
				class:completed={task.isCompleted}
				style="--priority-color: {PRIORITY_COLORS[task.priority]};"
				onclick={() => handleTaskClick(task)}
			>
				<span class="priority-dot"></span>
				<span class="todo-cell-title">{task.title}</span>
			</button>
		{/each}

		{#if overflowCount > 0}
			<span class="overflow-text">+{overflowCount} Aufgaben</span>
		{/if}
	</div>
{/if}

<!-- Detail Modal -->
{#if selectedTask}
	<TodoDetailModal task={selectedTask} onClose={handleModalClose} />
{/if}

<style>
	.todo-day-cell {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-bottom: 2px;
	}

	.todo-cell-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 1px 4px;
		border-radius: 3px;
		border: none;
		background: hsl(var(--color-muted) / 0.3);
		cursor: pointer;
		transition: background 150ms ease;
		text-align: left;
		width: 100%;
	}

	.todo-cell-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.todo-cell-item.completed {
		opacity: 0.5;
	}

	.todo-cell-item.completed .todo-cell-title {
		text-decoration: line-through;
	}

	.priority-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--priority-color);
		flex-shrink: 0;
	}

	.todo-cell-title {
		font-size: 0.625rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.overflow-text {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0 4px;
	}
</style>
