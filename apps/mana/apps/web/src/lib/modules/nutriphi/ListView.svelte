<!--
  NutriPhi — Workbench ListView
  Today's nutrition progress with meal log.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalMeal, LocalGoal } from './types';

	const mealsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalMeal>('meals').toArray();
		const visible = all.filter((m) => !m.deletedAt);
		return decryptRecords('meals', visible);
	}, [] as LocalMeal[]);

	const goalsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalGoal>('nutriphiGoals').toArray();
		return all.filter((g) => !g.deletedAt);
	}, [] as LocalGoal[]);

	const meals = $derived(mealsQuery.value);
	const goals = $derived(goalsQuery.value);

	const todayStr = new Date().toISOString().split('T')[0];
	const todayMeals = $derived(meals.filter((m) => m.date === todayStr));
	const goal = $derived(goals[0]);

	const totalCalories = $derived(
		todayMeals.reduce((sum, m) => sum + (m.nutrition?.calories ?? 0), 0)
	);
	const totalProtein = $derived(
		todayMeals.reduce((sum, m) => sum + (m.nutrition?.protein ?? 0), 0)
	);

	const calorieProgress = $derived(
		goal?.dailyCalories ? Math.min(100, (totalCalories / goal.dailyCalories) * 100) : 0
	);

	const mealTypeLabels: Record<string, string> = {
		breakfast: 'Frühstück',
		lunch: 'Mittagessen',
		dinner: 'Abendessen',
		snack: 'Snack',
	};
</script>

<BaseListView items={todayMeals} getKey={(m) => m.id} emptyTitle="Noch keine Mahlzeiten heute">
	{#snippet toolbar()}
		<!-- Calorie progress -->
		<div class="text-center">
			<p class="text-2xl font-light text-white/90">{Math.round(totalCalories)}</p>
			<p class="text-xs text-white/40">
				{#if goal}
					von {goal.dailyCalories} kcal
				{:else}
					kcal heute
				{/if}
			</p>
			{#if goal}
				<div class="mx-auto mt-2 h-1.5 w-32 rounded-full bg-white/10">
					<div
						class="h-full rounded-full transition-all {calorieProgress >= 100
							? 'bg-green-400'
							: 'bg-blue-400'}"
						style="width: {calorieProgress}%"
					></div>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet header()}
		<span class="mx-auto">{Math.round(totalProtein)}g Protein · {todayMeals.length} Mahlzeiten</span
		>
	{/snippet}

	{#snippet item(meal)}
		<div class="mb-1 min-h-[44px] rounded-md px-3 py-2 transition-colors hover:bg-white/5">
			<div class="flex items-center justify-between">
				<span class="text-xs text-white/50">{mealTypeLabels[meal.mealType] ?? meal.mealType}</span>
				{#if meal.nutrition}
					<span class="text-xs text-white/50">{Math.round(meal.nutrition.calories)} kcal</span>
				{/if}
			</div>
			<p class="truncate text-sm text-white/70">{meal.description}</p>
		</div>
	{/snippet}
</BaseListView>
