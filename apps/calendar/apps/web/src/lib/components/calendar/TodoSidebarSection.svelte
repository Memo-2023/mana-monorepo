<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import type { Task } from '$lib/api/todos';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import TodoDetailModal from '$lib/components/todo/TodoDetailModal.svelte';
	import QuickAddTodo from '$lib/components/todo/QuickAddTodo.svelte';
	import { ChevronDown, ChevronRight, Plus, CheckSquare, AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	interface Props {
		maxItems?: number;
	}

	let { maxItems = 5 }: Props = $props();

	let isExpanded = $state(true);
	let showQuickAdd = $state(false);
	let selectedTask = $state<Task | null>(null);

	// Derived: combined overdue + today todos
	const displayTodos = $derived(todosStore.getSidebarTodos(maxItems));
	const overdueCount = $derived(todosStore.overdueTodos.length);
	const totalActiveCount = $derived(todosStore.activeTodosCount);

	onMount(async () => {
		// Fetch todos on mount
		await todosStore.fetchTodayTodos();
		await todosStore.fetchUpcomingTodos();
	});

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function handleAddClick(e: MouseEvent) {
		e.stopPropagation();
		showQuickAdd = true;
	}

	function handleTaskClick(task: Task) {
		selectedTask = task;
	}

	function handleModalClose() {
		selectedTask = null;
	}

	function handleQuickAddSubmit() {
		// Keep quick add open for successive adds
	}

	function handleQuickAddCancel() {
		showQuickAdd = false;
	}

	function goToAllTasks() {
		goto('/tasks');
	}
</script>

<div class="todo-sidebar-section">
	<!-- Header -->
	<div class="section-header">
		<button type="button" class="header-toggle" onclick={toggleExpanded}>
			{#if isExpanded}
				<ChevronDown size={16} />
			{:else}
				<ChevronRight size={16} />
			{/if}
			<CheckSquare size={16} class="section-icon" />
			<span class="section-title">Aufgaben</span>
			{#if totalActiveCount > 0}
				<span class="count-badge">{totalActiveCount}</span>
			{/if}
			{#if overdueCount > 0}
				<span class="overdue-badge" title="{overdueCount} überfällig">
					<AlertTriangle size={12} />
				</span>
			{/if}
		</button>
		<button
			type="button"
			class="add-button"
			onclick={handleAddClick}
			aria-label="Aufgabe hinzufügen"
		>
			<Plus size={16} />
		</button>
	</div>

	<!-- Content -->
	{#if isExpanded}
		<div class="section-content">
			{#if !todosStore.serviceAvailable}
				<div class="service-unavailable">
					<AlertTriangle size={16} />
					<span>Todo-Service nicht erreichbar</span>
				</div>
			{:else if todosStore.loading}
				<div class="loading">
					<div class="loading-spinner"></div>
					<span>Laden...</span>
				</div>
			{:else if displayTodos.length === 0}
				<div class="empty-state">
					<CheckSquare size={20} />
					<span>Keine offenen Aufgaben</span>
				</div>
			{:else}
				<div class="todo-list">
					{#each displayTodos as task (task.id)}
						<TodoItem
							{task}
							variant="compact"
							showProject={false}
							onclick={() => handleTaskClick(task)}
						/>
					{/each}
				</div>

				{#if totalActiveCount > maxItems}
					<button type="button" class="show-all-button" onclick={goToAllTasks}>
						Alle {totalActiveCount} anzeigen
					</button>
				{/if}
			{/if}

			<!-- Quick Add -->
			{#if showQuickAdd}
				<div class="quick-add-wrapper">
					<QuickAddTodo
						placeholder="Neue Aufgabe..."
						autofocus
						showButton={false}
						onsubmit={handleQuickAddSubmit}
						oncancel={handleQuickAddCancel}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if selectedTask}
	<TodoDetailModal task={selectedTask} onClose={handleModalClose} />
{/if}

<style>
	.todo-sidebar-section {
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		overflow: hidden;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0 0.5rem 0 0;
	}

	.header-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 0.75rem 0.5rem 0.75rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: background 150ms ease;
	}

	.header-toggle:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	.header-toggle :global(svg) {
		color: hsl(var(--color-muted-foreground));
	}

	.header-toggle :global(.section-icon) {
		color: hsl(var(--color-primary));
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.count-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		padding: 1px 6px;
		border-radius: 9999px;
	}

	.overdue-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-danger));
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md);
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.add-button:hover {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.section-content {
		padding: 0 0.5rem 0.5rem;
	}

	.todo-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.service-unavailable,
	.loading,
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}

	.service-unavailable {
		color: hsl(var(--color-danger));
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid hsl(var(--color-muted));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 600ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.show-all-button {
		width: 100%;
		padding: 0.5rem;
		margin-top: 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-primary));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background 150ms ease;
	}

	.show-all-button:hover {
		background: hsl(var(--color-primary) / 0.1);
	}

	.quick-add-wrapper {
		margin-top: 0.5rem;
		padding: 0 0.25rem;
	}
</style>
