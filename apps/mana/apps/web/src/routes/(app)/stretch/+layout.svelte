<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import {
		useAllStretchExercises,
		useAllStretchRoutines,
		useAllStretchSessions,
		useAllStretchAssessments,
		useAllStretchReminders,
	} from '$lib/modules/stretch/queries';

	let { children }: { children: Snippet } = $props();

	setContext('stretchExercises', useAllStretchExercises());
	setContext('stretchRoutines', useAllStretchRoutines());
	setContext('stretchSessions', useAllStretchSessions());
	setContext('stretchAssessments', useAllStretchAssessments());
	setContext('stretchReminders', useAllStretchReminders());
</script>

{@render children()}
