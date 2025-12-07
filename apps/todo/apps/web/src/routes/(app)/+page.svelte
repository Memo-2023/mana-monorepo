<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { format, addDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { ListChecks } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import QuickAddTask from '$lib/components/QuickAddTask.svelte';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import type { Task } from '@todo/shared';

	let isLoading = $state(true);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		viewStore.setToday();
		await tasksStore.fetchAllTasks();
		isLoading = false;
	});

	// Derived task lists
	let overdueTasks = $derived(tasksStore.overdueTasks);
	let todayTasks = $derived(tasksStore.todayTasks);
	let completedTasks = $derived(tasksStore.completedTasks);

	// Group upcoming tasks by day
	let groupedUpcomingTasks = $derived(() => {
		const groups: { date: Date; label: string; tasks: Task[] }[] = [];
		const today = startOfDay(new Date());

		// Start from tomorrow (day 1) through day 7
		for (let i = 1; i <= 7; i++) {
			const date = addDays(today, i);
			const dayTasks = tasksStore.tasks.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === date.getTime();
			});

			if (dayTasks.length > 0) {
				let label: string;
				if (i === 1) {
					label = 'Morgen';
				} else {
					label = format(date, 'EEEE, d. MMMM', { locale: de });
				}

				groups.push({ date, label, tasks: dayTasks });
			}
		}

		return groups;
	});

	// Total upcoming count
	let upcomingCount = $derived(
		groupedUpcomingTasks().reduce((sum, group) => sum + group.tasks.length, 0)
	);

	// Check if all sections are empty
	let allEmpty = $derived(
		overdueTasks.length === 0 &&
			todayTasks.length === 0 &&
			upcomingCount === 0 &&
			completedTasks.length === 0
	);
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<div class="unified-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Meine Aufgaben</h1>
		<p class="text-muted-foreground text-sm mt-1">Alle deine Aufgaben auf einen Blick</p>
	</header>

	<QuickAddTask />

	{#if isLoading || tasksStore.loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"
			></div>
		</div>
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
					<TaskList tasks={overdueTasks} />
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
				{#if todayTasks.length === 0}
					<div class="text-center py-6 text-muted-foreground">
						<p>Keine Aufgaben für heute</p>
					</div>
				{:else}
					<TaskList tasks={todayTasks} />
				{/if}
			</CollapsibleSection>

			<!-- Upcoming Section -->
			<CollapsibleSection
				title="Demnächst"
				count={upcomingCount}
				icon="upcoming"
				variant="default"
				defaultOpen={true}
			>
				{#if upcomingCount === 0}
					<div class="text-center py-6 text-muted-foreground">
						<p>Keine anstehenden Aufgaben</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each groupedUpcomingTasks() as group}
							<div>
								<h3 class="text-sm font-medium text-muted-foreground mb-2 pl-2">
									{group.label} ({group.tasks.length})
								</h3>
								<TaskList tasks={group.tasks} />
							</div>
						{/each}
					</div>
				{/if}
			</CollapsibleSection>

			<!-- Completed Section - collapsed by default -->
			<CollapsibleSection
				title="Erledigt"
				count={completedTasks.length}
				icon="completed"
				variant="success"
				defaultOpen={false}
			>
				{#if completedTasks.length === 0}
					<div class="text-center py-6 text-muted-foreground">
						<p>Noch keine erledigten Aufgaben</p>
					</div>
				{:else}
					<TaskList tasks={completedTasks} showCompleted />
				{/if}
			</CollapsibleSection>
		</div>
	{/if}
</div>

<style>
	.unified-view {
		padding-bottom: 100px;
	}
</style>
