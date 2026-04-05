<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllTasks,
		useAllLabels,
		useAllBoardViews,
		useAllProjects,
	} from '$lib/modules/todo/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allTasks = useAllTasks();
	const allLabels = useAllLabels();
	const boardViews = useAllBoardViews();
	const allProjects = useAllProjects();

	// Provide data to child components via Svelte context
	setContext('tasks', allTasks);
	setContext('labels', allLabels);
	setContext('boardViews', boardViews);
	setContext('projects', allProjects);
</script>

{@render children()}
