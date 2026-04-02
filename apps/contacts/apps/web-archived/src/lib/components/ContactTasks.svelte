<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { ClipboardText, Warning, Check } from '@manacore/shared-icons';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { PRIORITY_COLORS, type Task } from '$lib/api/todos';

	interface Props {
		contactId: string;
	}

	let { contactId }: Props = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCompleted = $state(false);
	let displayLimit = $state(10);

	// Categorized tasks
	let assignedTasks = $state<Task[]>([]);
	let involvedTasks = $state<Task[]>([]);

	// Derived values
	const visibleAssigned = $derived.by(() => {
		const filtered = showCompleted ? assignedTasks : assignedTasks.filter((t) => !t.isCompleted);
		return filtered.slice(0, displayLimit);
	});

	const visibleInvolved = $derived.by(() => {
		const filtered = showCompleted ? involvedTasks : involvedTasks.filter((t) => !t.isCompleted);
		return filtered.slice(0, displayLimit);
	});

	const totalVisible = $derived(visibleAssigned.length + visibleInvolved.length);
	const totalTasks = $derived(assignedTasks.length + involvedTasks.length);
	const hasMore = $derived(totalVisible < totalTasks);

	async function loadTasks() {
		loading = true;
		error = null;

		try {
			// Always load with completed to get full list, filter in UI
			await todosStore.loadTasksForContact(contactId, true);
			const categorized = todosStore.categorizeTasksForContact(contactId);
			assignedTasks = categorized.assigned;
			involvedTasks = categorized.involved;
		} catch (e) {
			error = e instanceof Error ? e.message : $_('contact.tasks.error');
		} finally {
			loading = false;
		}
	}

	async function handleToggleComplete(task: Task) {
		const success = await todosStore.toggleTaskCompletion(task.id, contactId);
		if (success) {
			// Refresh categorization
			const categorized = todosStore.categorizeTasksForContact(contactId);
			assignedTasks = categorized.assigned;
			involvedTasks = categorized.involved;
		}
	}

	function formatDueDate(dueDate: string | null | undefined): {
		text: string;
		status: 'overdue' | 'today' | 'upcoming' | 'none';
	} {
		if (!dueDate) return { text: '', status: 'none' };

		const due = new Date(dueDate);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

		const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return { text: $_('contact.tasks.overdue'), status: 'overdue' };
		} else if (diffDays === 0) {
			return { text: $_('contact.tasks.dueToday'), status: 'today' };
		} else if (diffDays === 1) {
			return { text: $_('contact.tasks.tomorrow'), status: 'upcoming' };
		} else if (diffDays < 7) {
			return { text: due.toLocaleDateString('de-DE', { weekday: 'short' }), status: 'upcoming' };
		} else {
			return {
				text: due.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
				status: 'upcoming',
			};
		}
	}

	function showMore() {
		displayLimit += 10;
	}

	onMount(loadTasks);
</script>

<section class="tasks-section">
	<div class="section-header">
		<div class="section-icon">
			<ClipboardText size={16} />
		</div>
		<h3 class="section-title">{$_('contact.tasks.title')}</h3>
		<label class="show-completed-toggle">
			<input type="checkbox" bind:checked={showCompleted} />
			<span>{$_('contact.tasks.showCompleted')}</span>
		</label>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">
			<span class="spinner"></span>
		</div>
	{:else if !todosStore.serviceAvailable}
		<div class="service-unavailable">
			<Warning size={24} />
			<p>{$_('contact.tasks.serviceUnavailable')}</p>
		</div>
	{:else if totalTasks === 0}
		<div class="empty-tasks">
			<p>{$_('contact.tasks.empty')}</p>
		</div>
	{:else}
		<!-- Assigned Tasks -->
		{#if assignedTasks.length > 0}
			<div class="task-group">
				<div class="group-header">
					<span class="group-title">{$_('contact.tasks.assigned')}</span>
					<span class="group-count">{visibleAssigned.length}</span>
				</div>
				<div class="tasks-list">
					{#each visibleAssigned as task (task.id)}
						{@const dueInfo = formatDueDate(task.dueDate)}
						<div class="task-item" class:completed={task.isCompleted}>
							<button
								class="task-checkbox"
								onclick={() => handleToggleComplete(task)}
								aria-label={task.isCompleted
									? $_('contact.tasks.markIncomplete')
									: $_('contact.tasks.markComplete')}
								style="--priority-color: {PRIORITY_COLORS[task.priority]}"
							>
								{#if task.isCompleted}
									<Check size={12} weight="bold" class="text-white" />
								{/if}
							</button>
							<div class="task-content">
								<span class="task-title" class:completed={task.isCompleted}>{task.title}</span>
								{#if task.project}
									<span class="task-project" style="--project-color: {task.project.color}"
										>{task.project.name}</span
									>
								{/if}
							</div>
							{#if dueInfo.status !== 'none' && !task.isCompleted}
								<span
									class="task-due"
									class:overdue={dueInfo.status === 'overdue'}
									class:today={dueInfo.status === 'today'}
								>
									{dueInfo.text}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Involved Tasks -->
		{#if involvedTasks.length > 0}
			<div class="task-group">
				<div class="group-header">
					<span class="group-title">{$_('contact.tasks.involved')}</span>
					<span class="group-count">{visibleInvolved.length}</span>
				</div>
				<div class="tasks-list">
					{#each visibleInvolved as task (task.id)}
						{@const dueInfo = formatDueDate(task.dueDate)}
						<div class="task-item" class:completed={task.isCompleted}>
							<button
								class="task-checkbox"
								onclick={() => handleToggleComplete(task)}
								aria-label={task.isCompleted
									? $_('contact.tasks.markIncomplete')
									: $_('contact.tasks.markComplete')}
								style="--priority-color: {PRIORITY_COLORS[task.priority]}"
							>
								{#if task.isCompleted}
									<Check size={12} weight="bold" class="text-white" />
								{/if}
							</button>
							<div class="task-content">
								<span class="task-title" class:completed={task.isCompleted}>{task.title}</span>
								{#if task.project}
									<span class="task-project" style="--project-color: {task.project.color}"
										>{task.project.name}</span
									>
								{/if}
							</div>
							{#if dueInfo.status !== 'none' && !task.isCompleted}
								<span
									class="task-due"
									class:overdue={dueInfo.status === 'overdue'}
									class:today={dueInfo.status === 'today'}
								>
									{dueInfo.text}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Show More Button -->
		{#if hasMore}
			<button class="show-more-btn" onclick={showMore}>
				{$_('contact.tasks.showMore', { values: { count: totalTasks - totalVisible } })}
			</button>
		{/if}
	{/if}
</section>

<style>
	.tasks-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.75rem;
	}

	.section-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-accent) / 0.1);
		color: hsl(var(--color-accent));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-icon svg {
		width: 1rem;
		height: 1rem;
	}

	.section-title {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.show-completed-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}

	.show-completed-toggle input {
		width: 0.875rem;
		height: 0.875rem;
		accent-color: hsl(var(--color-primary));
	}

	.error-message {
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-error) / 0.1);
		border-radius: 0.5rem;
		color: hsl(var(--color-error));
		font-size: 0.8125rem;
		margin-bottom: 0.75rem;
	}

	.loading {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid hsl(var(--color-muted));
		border-top-color: hsl(var(--color-accent));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.service-unavailable {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		color: hsl(var(--color-muted-foreground));
	}

	.service-unavailable svg {
		width: 1.5rem;
		height: 1.5rem;
		color: hsl(var(--color-warning));
	}

	.service-unavailable p {
		font-size: 0.8125rem;
		text-align: center;
	}

	.empty-tasks {
		text-align: center;
		padding: 1.5rem 1rem;
	}

	.empty-tasks p {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Task Groups */
	.task-group {
		margin-bottom: 0.75rem;
	}

	.task-group:last-of-type {
		margin-bottom: 0;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.group-title {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.group-count {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	/* Tasks List */
	.tasks-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.task-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.task-item.completed {
		opacity: 0.6;
	}

	.task-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.25rem;
		border: 2px solid var(--priority-color, hsl(var(--color-border)));
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.task-checkbox:hover {
		background: hsl(var(--color-muted));
	}

	.task-item.completed .task-checkbox {
		background: var(--priority-color, hsl(var(--color-primary)));
		border-color: var(--priority-color, hsl(var(--color-primary)));
	}

	.task-checkbox svg {
		width: 0.75rem;
		height: 0.75rem;
		color: white;
	}

	.task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.task-title {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.task-title.completed {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.task-project {
		font-size: 0.6875rem;
		color: var(--project-color, hsl(var(--color-muted-foreground)));
	}

	.task-due {
		font-size: 0.6875rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		flex-shrink: 0;
	}

	.task-due.overdue {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.task-due.today {
		background: hsl(var(--color-warning) / 0.1);
		color: hsl(var(--color-warning));
	}

	/* Show More Button */
	.show-more-btn {
		width: 100%;
		padding: 0.5rem;
		margin-top: 0.5rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.show-more-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}
</style>
