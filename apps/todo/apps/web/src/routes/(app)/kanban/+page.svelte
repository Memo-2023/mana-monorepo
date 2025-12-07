<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { TaskPriority } from '@todo/shared';
	import { authStore } from '$lib/stores/auth.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import { KanbanBoard, KanbanFilters } from '$lib/components/kanban';

	// Filter state
	let filterPriorities = $state<TaskPriority[]>([]);
	let filterProjectId = $state<string | null>(null);
	let filterLabelIds = $state<string[]>([]);
	let filterSearchQuery = $state('');

	function clearFilters() {
		filterPriorities = [];
		filterProjectId = null;
		filterLabelIds = [];
		filterSearchQuery = '';
	}

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch kanban data (columns + tasks grouped by column)
		await kanbanStore.fetchKanbanData();
	});
</script>

<svelte:head>
	<title>Kanban Board - Todo</title>
</svelte:head>

<div class="kanban-page h-full">
	<header class="mb-4">
		<h1 class="text-2xl font-bold text-foreground">Kanban Board</h1>
		<p class="text-muted-foreground text-sm mt-1">
			Ziehe Aufgaben zwischen Spalten, um ihren Status zu ändern
		</p>
	</header>

	<div class="mb-4">
		<KanbanFilters
			selectedPriorities={filterPriorities}
			selectedProjectId={filterProjectId}
			selectedLabelIds={filterLabelIds}
			searchQuery={filterSearchQuery}
			onPrioritiesChange={(priorities) => (filterPriorities = priorities)}
			onProjectChange={(projectId) => (filterProjectId = projectId)}
			onLabelsChange={(labelIds) => (filterLabelIds = labelIds)}
			onSearchChange={(query) => (filterSearchQuery = query)}
			onClearFilters={clearFilters}
		/>
	</div>

	<div class="board-container">
		<KanbanBoard {filterPriorities} {filterProjectId} {filterLabelIds} {filterSearchQuery} />
	</div>
</div>

<style>
	.kanban-page {
		display: flex;
		flex-direction: column;
	}

	.board-container {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
