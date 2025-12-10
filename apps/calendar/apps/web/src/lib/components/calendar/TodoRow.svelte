<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import type { Task } from '$lib/api/todos';
	import { PRIORITY_COLORS } from '$lib/api/todos';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoDetailModal from '$lib/components/todo/TodoDetailModal.svelte';
	import { Check } from 'lucide-svelte';

	interface Props {
		date: Date;
		maxVisible?: number;
	}

	let { date, maxVisible = 3 }: Props = $props();

	let selectedTask = $state<Task | null>(null);
	let togglingIds = $state<Set<string>>(new Set());

	const todosForDay = $derived(todosStore.getTodosForDay(date));
	const visibleTodos = $derived(todosForDay.slice(0, maxVisible));
	const overflowCount = $derived(Math.max(0, todosForDay.length - maxVisible));

	async function handleToggle(task: Task) {
		togglingIds = new Set([...togglingIds, task.id]);
		await todosStore.toggleComplete(task.id);
		togglingIds = new Set([...togglingIds].filter((id) => id !== task.id));
	}

	function handleTaskClick(task: Task, e: MouseEvent) {
		// Don't open modal if clicking checkbox
		if ((e.target as HTMLElement).closest('.todo-checkbox')) return;
		selectedTask = task;
	}

	function handleModalClose() {
		selectedTask = null;
	}

	function handleShowAll() {
		// Show first todo's modal, or navigate to tasks page
		if (todosForDay.length > 0) {
			selectedTask = todosForDay[0];
		}
	}
</script>

{#if todosForDay.length > 0}
	<div class="todo-row">
		<span class="todo-row-label">Aufgaben:</span>
		<div class="todo-pills">
			{#each visibleTodos as task (task.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<button
					type="button"
					class="todo-pill"
					class:completed={task.isCompleted}
					style="--priority-color: {PRIORITY_COLORS[task.priority]};"
					onclick={(e) => handleTaskClick(task, e)}
				>
					<TodoCheckbox
						checked={task.isCompleted}
						loading={togglingIds.has(task.id)}
						size="sm"
						onchange={() => handleToggle(task)}
					/>
					<span class="todo-pill-title">{task.title}</span>
				</button>
			{/each}

			{#if overflowCount > 0}
				<button type="button" class="overflow-badge" onclick={handleShowAll}>
					+{overflowCount} mehr
				</button>
			{/if}
		</div>
	</div>
{/if}

<!-- Detail Modal -->
{#if selectedTask}
	<TodoDetailModal task={selectedTask} onClose={handleModalClose} />
{/if}

<style>
	.todo-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		background: hsl(var(--color-muted) / 0.2);
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.todo-row-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.todo-pills {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.todo-pills::-webkit-scrollbar {
		display: none;
	}

	.todo-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-md);
		border: none;
		background: hsl(var(--color-surface));
		border-left: 2px solid var(--priority-color);
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
		max-width: 150px;
	}

	.todo-pill:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.todo-pill.completed {
		opacity: 0.6;
	}

	.todo-pill.completed .todo-pill-title {
		text-decoration: line-through;
	}

	.todo-pill-title {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.overflow-badge {
		display: flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-md);
		border: none;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 150ms ease;
	}

	.overflow-badge:hover {
		background: hsl(var(--color-primary) / 0.2);
	}
</style>
