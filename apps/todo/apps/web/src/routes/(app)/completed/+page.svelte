<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import TaskList from '$lib/components/TaskList.svelte';

	let isLoading = $state(true);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		viewStore.setCompleted();
		await tasksStore.fetchTasks({ isCompleted: true });
		isLoading = false;
	});
</script>

<svelte:head>
	<title>Erledigt | Todo</title>
</svelte:head>

<div class="completed-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Erledigt</h1>
		<p class="text-muted-foreground text-sm mt-1">Erledigte Aufgaben</p>
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
	{:else if tasksStore.completedTasks.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">✅</div>
			<h3 class="text-lg font-medium text-foreground mb-2">Noch nichts erledigt</h3>
			<p class="text-muted-foreground">Erledigte Aufgaben werden hier angezeigt.</p>
		</div>
	{:else}
		<TaskList tasks={tasksStore.completedTasks} showCompleted />
	{/if}
</div>

<style>
	.completed-view {
		padding-bottom: 100px;
	}
</style>
