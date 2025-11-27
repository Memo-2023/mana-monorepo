<script lang="ts">
	import type { Meal } from '$lib/types/meal';
	import MealCard from './MealCard.svelte';

	interface Props {
		meals: Meal[];
		onMealClick: (meal: Meal) => void;
	}

	let { meals, onMealClick }: Props = $props();
</script>

{#if meals.length === 0}
	<div class="flex h-64 flex-col items-center justify-center text-center">
		<div class="mb-4 text-6xl">🥗</div>
		<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Keine Mahlzeiten</h2>
		<p class="text-gray-600 dark:text-gray-400">Erfasse deine erste Mahlzeit mit einem Foto</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each meals as meal (meal.id)}
			<MealCard {meal} onclick={() => onMealClick(meal)} />
		{/each}
	</div>
{/if}
