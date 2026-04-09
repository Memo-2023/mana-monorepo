<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllBodyExercises,
		useAllBodyRoutines,
		useAllBodyWorkouts,
		useAllBodySets,
		useAllBodyMeasurements,
		useAllBodyChecks,
		useAllBodyPhases,
		useNutriphiMealsSince,
		dateNDaysAgo,
	} from '$lib/modules/body/queries';

	let { children }: { children: Snippet } = $props();

	setContext('bodyExercises', useAllBodyExercises());
	setContext('bodyRoutines', useAllBodyRoutines());
	setContext('bodyWorkouts', useAllBodyWorkouts());
	setContext('bodySets', useAllBodySets());
	setContext('bodyMeasurements', useAllBodyMeasurements());
	setContext('bodyChecks', useAllBodyChecks());
	setContext('bodyPhases', useAllBodyPhases());
	// Cross-module read for the Body × Nutriphi correlation chart.
	// 8 weeks back covers a typical cut/bulk cycle and matches the chart default.
	setContext('bodyNutriphiMeals', useNutriphiMealsSince(dateNDaysAgo(56)));
</script>

{@render children()}
