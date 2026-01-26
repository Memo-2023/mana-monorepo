<script lang="ts">
	import { onMount } from 'svelte';
	import { format, addDays, subDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { ListChecks } from '@manacore/shared-icons';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import TaskEditModal from '$lib/components/TaskEditModal.svelte';
	import { TaskListSkeleton } from '$lib/components/skeletons';
	import type { Task, UpdateTaskInput } from '@todo/shared';

	let isLoading = $state(true);
	let editingTask = $state<Task | null>(null);

	onMount(async () => {
		viewStore.setToday();

		try {
			// Fetch tasks (works in both guest and authenticated mode)
			await tasksStore.fetchAllTasks();
		} catch (error) {
			console.error('Failed to load tasks:', error);
		}

		isLoading = false;
	});

	// Derived task lists
	let overdueTasks = $derived(tasksStore.overdueTasks);
	let todayTasks = $derived(tasksStore.todayTasks);
	let completedTasks = $derived(tasksStore.completedTasks);

	// Tomorrow's tasks
	let tomorrowDate = $derived(addDays(startOfDay(new Date()), 1));
	let dayAfterTomorrowDate = $derived(addDays(startOfDay(new Date()), 2));
	let tomorrowTasks = $derived(
		tasksStore.tasks.filter((task) => {
			if (!task.dueDate || task.isCompleted) return false;
			const taskDate = startOfDay(new Date(task.dueDate));
			return taskDate.getTime() === tomorrowDate.getTime();
		})
	);

	// Group upcoming tasks by day (starting from day after tomorrow)
	let groupedUpcomingTasks = $derived(() => {
		const groups: { date: Date; label: string; tasks: Task[] }[] = [];
		const today = startOfDay(new Date());

		// Start from day after tomorrow (day 2) through day 7
		for (let i = 2; i <= 7; i++) {
			const date = addDays(today, i);
			const dayTasks = tasksStore.tasks.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === date.getTime();
			});

			if (dayTasks.length > 0) {
				const label = format(date, 'EEEE, d. MMMM', { locale: de });
				groups.push({ date, label, tasks: dayTasks });
			}
		}

		return groups;
	});

	// Total upcoming count (excluding tomorrow)
	let upcomingCount = $derived(
		groupedUpcomingTasks().reduce((sum, group) => sum + group.tasks.length, 0)
	);

	// Check if all sections are empty
	let allEmpty = $derived(
		overdueTasks.length === 0 &&
			todayTasks.length === 0 &&
			tomorrowTasks.length === 0 &&
			upcomingCount === 0 &&
			completedTasks.length === 0
	);

	// Modal handlers
	function openEditModal(task: Task) {
		editingTask = task;
	}

	function closeEditModal() {
		editingTask = null;
	}

	async function handleSaveTask(data: UpdateTaskInput) {
		if (!editingTask) return;

		try {
			// Update task - cast metadata to be compatible with store type
			const updateData = {
				...data,
				metadata: data.metadata as { [key: string]: unknown } | null | undefined,
			};
			await tasksStore.updateTask(editingTask.id, updateData);

			// Update labels if provided
			if (data.labelIds !== undefined) {
				await tasksStore.updateLabels(editingTask.id, data.labelIds);
			}

			closeEditModal();
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	}

	async function handleDeleteTask(taskId: string) {
		try {
			await tasksStore.deleteTask(taskId);
			closeEditModal();
		} catch (error) {
			console.error('Failed to delete task:', error);
		}
	}

	// Drag and drop handler - uses optimistic updates for smooth UX
	function handleTaskDrop(taskId: string, targetDate: Date | 'completed' | 'overdue') {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;

		if (targetDate === 'completed') {
			// Mark task as completed (optimistic)
			if (!task.isCompleted) {
				tasksStore.updateTaskOptimistic(taskId, { isCompleted: true });
			}
		} else if (targetDate === 'overdue') {
			// Set to yesterday (optimistic)
			const yesterday = subDays(startOfDay(new Date()), 1);
			tasksStore.updateTaskOptimistic(taskId, {
				dueDate: yesterday.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		} else {
			// Set to specific date (optimistic)
			tasksStore.updateTaskOptimistic(taskId, {
				dueDate: targetDate.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		}
	}
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<div class="unified-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Meine Aufgaben</h1>
		<p class="text-muted-foreground text-sm mt-1">Alle deine Aufgaben auf einen Blick</p>
	</header>

	{#if isLoading || tasksStore.loading}
		<TaskListSkeleton sections={3} tasksPerSection={3} />
	{:else if tasksStore.error}
		<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
			{tasksStore.error}
		</div>
	{:else if allEmpty}
		<div class="text-center py-12">
			<div class="flex justify-center mb-4 text-muted-foreground">
				<ListChecks size={48} weight="light" />
			</div>
			<h3 class="text-lg font-medium text-foreground mb-2">Noch keine Aufgaben</h3>
			<p class="text-muted-foreground">Erstelle deine erste Aufgabe mit dem Eingabefeld oben.</p>
		</div>
	{:else}
		<div class="space-y-2">
			<!-- Overdue Section - only show if there are overdue tasks -->
			{#if overdueTasks.length > 0}
				<CollapsibleSection
					title="Überfällig"
					count={overdueTasks.length}
					icon="warning"
					variant="warning"
					defaultOpen={true}
				>
					<TaskList
						tasks={overdueTasks}
						enableDragDrop
						dropTargetDate="overdue"
						onTaskDrop={handleTaskDrop}
						onEditTask={openEditModal}
					/>
				</CollapsibleSection>
			{/if}

			<!-- Today Section -->
			<CollapsibleSection
				title="Heute"
				count={todayTasks.length}
				icon="today"
				variant="default"
				defaultOpen={true}
			>
				<TaskList
					tasks={todayTasks}
					enableDragDrop
					dropTargetDate={startOfDay(new Date())}
					onTaskDrop={handleTaskDrop}
					onEditTask={openEditModal}
				/>
			</CollapsibleSection>

			<!-- Tomorrow Section -->
			<CollapsibleSection
				title="Morgen"
				count={tomorrowTasks.length}
				icon="upcoming"
				variant="default"
				defaultOpen={true}
			>
				<TaskList
					tasks={tomorrowTasks}
					enableDragDrop
					dropTargetDate={tomorrowDate}
					onTaskDrop={handleTaskDrop}
					onEditTask={openEditModal}
				/>
			</CollapsibleSection>

			<!-- Upcoming Section -->
			<CollapsibleSection
				title="Demnächst"
				count={upcomingCount}
				icon="upcoming"
				variant="default"
				defaultOpen={true}
			>
				<div class="space-y-4">
					{#each groupedUpcomingTasks() as group}
						<div>
							<h3 class="text-sm font-medium text-muted-foreground mb-2 pl-2">
								{group.label} ({group.tasks.length})
							</h3>
							<TaskList
								tasks={group.tasks}
								enableDragDrop
								dropTargetDate={group.date}
								onTaskDrop={handleTaskDrop}
								onEditTask={openEditModal}
							/>
						</div>
					{/each}
					{#if upcomingCount === 0}
						<!-- Empty drop zone for day after tomorrow -->
						<TaskList
							tasks={[]}
							enableDragDrop
							dropTargetDate={dayAfterTomorrowDate}
							onTaskDrop={handleTaskDrop}
						/>
					{/if}
				</div>
			</CollapsibleSection>

			<!-- Completed Section -->
			<CollapsibleSection
				title="Erledigt"
				count={completedTasks.length}
				icon="completed"
				variant="success"
				defaultOpen={true}
			>
				<TaskList
					tasks={completedTasks}
					enableDragDrop
					dropTargetDate="completed"
					onTaskDrop={handleTaskDrop}
					showCompleted
					onEditTask={openEditModal}
				/>
			</CollapsibleSection>
		</div>
	{/if}
</div>

<!-- Task Edit Modal -->
{#if editingTask}
	<TaskEditModal
		task={editingTask}
		open={true}
		onClose={closeEditModal}
		onSave={handleSaveTask}
		onDelete={handleDeleteTask}
	/>
{/if}

<style>
	.unified-view {
		padding-bottom: 100px;
	}
</style>
