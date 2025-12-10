<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CaretLeft, Tag } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import TaskEditModal from '$lib/components/TaskEditModal.svelte';
	import { TaskListSkeleton } from '$lib/components/skeletons';
	import type { Task, Label } from '@todo/shared';

	let isLoading = $state(true);
	let editingTask = $state<Task | null>(null);
	let showEditModal = $state(false);

	// Get tag ID from URL
	const tagId = $derived($page.params.id ?? '');

	// Get tag from store
	const tag = $derived(labelsStore.getById(tagId));

	// Get tasks with this tag
	const tagTasks = $derived(tagId ? tasksStore.getTasksByLabel(tagId) : []);
	const incompleteTasks = $derived(tagTasks.filter((t) => !t.isCompleted));
	const completedTasks = $derived(tagTasks.filter((t) => t.isCompleted));

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		try {
			// Ensure tags are loaded
			if (labelsStore.labels.length === 0) {
				await labelsStore.fetchLabels();
			}

			// Fetch all tasks to filter by tag
			await tasksStore.fetchAllTasks();
		} catch (error) {
			console.error('Failed to load data:', error);
		}

		isLoading = false;
	});

	// Modal handlers
	function openEditModal(task: Task) {
		editingTask = task;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingTask = null;
	}

	function handleSaveTask(data: Partial<Task>) {
		if (!editingTask) return;

		// Extract only the fields that updateTask accepts
		const updateData = {
			title: data.title,
			description: data.description ?? undefined,
			projectId: data.projectId,
			dueDate: typeof data.dueDate === 'string' ? data.dueDate : data.dueDate?.toISOString(),
			priority: data.priority,
			status: data.status,
			subtasks: data.subtasks ?? undefined,
			recurrenceRule: data.recurrenceRule,
		};

		tasksStore.updateTask(editingTask.id, updateData).catch((error) => {
			console.error('Failed to update task:', error);
		});
		closeEditModal();
	}

	function handleDeleteTask(taskId: string) {
		tasksStore.deleteTask(taskId).catch((error) => {
			console.error('Failed to delete task:', error);
		});
		closeEditModal();
	}
</script>

<svelte:head>
	<title>{tag?.name || 'Tag'} - Todo</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<CaretLeft size={20} weight="bold" />
		</a>
		<div class="header-content">
			{#if tag}
				<div class="tag-icon" style="background-color: {tag.color}20">
					<div class="tag-dot" style="background-color: {tag.color}"></div>
				</div>
				<h1 class="title">{tag.name}</h1>
			{:else}
				<h1 class="title">Tag</h1>
			{/if}
		</div>
		<a href="/tags" class="manage-button" aria-label="Tags verwalten">
			<Tag size={20} weight="bold" />
		</a>
	</header>

	{#if isLoading}
		<TaskListSkeleton />
	{:else if !tag}
		<div class="empty-state">
			<div class="empty-icon">
				<Tag size={40} weight="light" />
			</div>
			<h2 class="empty-title">Tag nicht gefunden</h2>
			<p class="empty-description">Dieser Tag existiert nicht mehr.</p>
			<a href="/tags" class="btn btn-primary">Zu den Tags</a>
		</div>
	{:else if tagTasks.length === 0}
		<div class="empty-state">
			<div class="empty-icon" style="background-color: {tag.color}20">
				<Tag size={40} weight="light" style="color: {tag.color}" />
			</div>
			<h2 class="empty-title">Keine Aufgaben</h2>
			<p class="empty-description">
				Es gibt keine Aufgaben mit dem Tag "{tag.name}".
			</p>
			<a href="/" class="btn btn-primary">Aufgabe erstellen</a>
		</div>
	{:else}
		<!-- Incomplete Tasks -->
		{#if incompleteTasks.length > 0}
			<section class="task-section">
				<h2 class="section-title">
					Offen ({incompleteTasks.length})
				</h2>
				<TaskList tasks={incompleteTasks} onEditTask={openEditModal} />
			</section>
		{/if}

		<!-- Completed Tasks -->
		{#if completedTasks.length > 0}
			<section class="task-section">
				<h2 class="section-title completed">
					Erledigt ({completedTasks.length})
				</h2>
				<TaskList tasks={completedTasks} showCompleted={true} onEditTask={openEditModal} />
			</section>
		{/if}

		<p class="task-count">
			{tagTasks.length}
			{tagTasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}
		</p>
	{/if}
</div>

<!-- Task Edit Modal -->
{#if editingTask}
	<TaskEditModal
		task={editingTask}
		open={showEditModal}
		onClose={closeEditModal}
		onSave={handleSaveTask}
		onDelete={handleDeleteTask}
	/>
{/if}

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		margin-bottom: 1rem;
	}

	.header-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.tag-icon {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tag-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}

	.back-button,
	.manage-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
		transform: translateX(-2px);
	}

	.manage-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	/* Sections */
	.task-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.section-title.completed {
		color: hsl(var(--muted-foreground) / 0.7);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
		max-width: 280px;
	}

	/* Count */
	.task-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1rem;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover {
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}
</style>
