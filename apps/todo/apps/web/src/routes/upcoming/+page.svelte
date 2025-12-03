<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { format, addDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import type { Task } from '@todo/shared';

	let isLoading = $state(true);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		viewStore.setUpcoming();
		await tasksStore.fetchUpcomingTasks();
		isLoading = false;
	});

	// Group tasks by day
	let groupedTasks = $derived(() => {
		const groups: { date: Date; label: string; tasks: Task[] }[] = [];
		const today = startOfDay(new Date());

		for (let i = 0; i < 7; i++) {
			const date = addDays(today, i);
			const dayTasks = tasksStore.tasks.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === date.getTime();
			});

			if (dayTasks.length > 0) {
				let label: string;
				if (i === 0) {
					label = 'Heute';
				} else if (i === 1) {
					label = 'Morgen';
				} else {
					label = format(date, 'EEEE, d. MMMM', { locale: de });
				}

				groups.push({ date, label, tasks: dayTasks });
			}
		}

		return groups;
	});
</script>

<svelte:head>
	<title>Demnächst | Todo</title>
</svelte:head>

<div class="upcoming-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Demnächst</h1>
		<p class="text-muted-foreground text-sm mt-1">Aufgaben der nächsten 7 Tage</p>
	</header>

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
	{:else if groupedTasks().length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📅</div>
			<h3 class="text-lg font-medium text-foreground mb-2">Keine anstehenden Aufgaben</h3>
			<p class="text-muted-foreground">Keine Aufgaben in den nächsten 7 Tagen geplant.</p>
		</div>
	{:else}
		<div class="space-y-8">
			{#each groupedTasks() as group}
				<div>
					<h2 class="text-sm font-semibold text-muted-foreground mb-3">
						{group.label} ({group.tasks.length})
					</h2>
					<TaskList tasks={group.tasks} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.upcoming-view {
		padding-bottom: 100px;
	}
</style>
