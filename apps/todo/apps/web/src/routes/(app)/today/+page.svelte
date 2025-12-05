<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import QuickAddTask from '$lib/components/QuickAddTask.svelte';

	let isLoading = $state(true);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		viewStore.setToday();
		await tasksStore.fetchTodayTasks();
		isLoading = false;
	});

	// Separate overdue and today tasks
	let overdueTasks = $derived(tasksStore.overdueTasks);
	let todayTasks = $derived(tasksStore.todayTasks);
</script>

<svelte:head>
	<title>Heute | Todo</title>
</svelte:head>

<div class="today-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Heute</h1>
		<p class="text-muted-foreground text-sm mt-1">Fällige Aufgaben für heute</p>
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
	{:else}
		{#if overdueTasks.length > 0}
			<div class="mb-6">
				<h2 class="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					Überfällig ({overdueTasks.length})
				</h2>
				<TaskList tasks={overdueTasks} />
			</div>
		{/if}

		{#if todayTasks.length > 0}
			<div>
				<h2 class="text-sm font-semibold text-muted-foreground mb-3">
					Heute ({todayTasks.length})
				</h2>
				<TaskList tasks={todayTasks} />
			</div>
		{/if}

		{#if overdueTasks.length === 0 && todayTasks.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">🎉</div>
				<h3 class="text-lg font-medium text-foreground mb-2">Alles erledigt!</h3>
				<p class="text-muted-foreground">Keine Aufgaben für heute.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.today-view {
		padding-bottom: 100px;
	}
</style>
