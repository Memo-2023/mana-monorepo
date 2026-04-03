<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllHabits, useAllHabitLogs } from '$lib/modules/habits/queries';

	let { children }: { children: Snippet } = $props();

	const allHabits = useAllHabits();
	const allLogs = useAllHabitLogs();

	setContext('habits', allHabits);
	setContext('habitLogs', allLogs);
</script>

{@render children()}
