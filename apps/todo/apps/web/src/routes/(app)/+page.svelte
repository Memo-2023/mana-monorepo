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
		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Set view to inbox
		viewStore.setInbox();

		// Fetch inbox tasks
		await tasksStore.fetchInboxTasks();
		isLoading = false;
	});
</script>

<svelte:head>
	<title>Inbox | Todo</title>
</svelte:head>

<div class="inbox-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Inbox</h1>
		<p class="text-muted-foreground text-sm mt-1">Aufgaben ohne Projekt</p>
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
	{:else if tasksStore.incompleteTasks.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📥</div>
			<h3 class="text-lg font-medium text-foreground mb-2">Inbox ist leer</h3>
			<p class="text-muted-foreground">Füge eine neue Aufgabe hinzu, um loszulegen.</p>
		</div>
	{:else}
		<TaskList tasks={tasksStore.incompleteTasks} />
	{/if}

	{#if viewStore.showCompleted && tasksStore.completedTasks.length > 0}
		<div class="mt-8">
			<h2 class="text-lg font-semibold text-muted-foreground mb-4">
				Erledigt ({tasksStore.completedTasks.length})
			</h2>
			<TaskList tasks={tasksStore.completedTasks} showCompleted />
		</div>
	{/if}
</div>

<style>
	.inbox-view {
		padding-bottom: 100px;
	}
</style>
