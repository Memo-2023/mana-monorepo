<!--
  NutriPhi — Workbench ListView
  Today's nutrition progress with meal log.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { LocalMeal, LocalGoal } from './types';

	let meals = $state<LocalMeal[]>([]);
	let goals = $state<LocalGoal[]>([]);

	const todayStr = new Date().toISOString().split('T')[0];

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<LocalMeal>('meals').toArray();
			const visible = all.filter((m) => !m.deletedAt);
			return decryptRecords('meals', visible);
		}).subscribe((val) => {
			meals = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalGoal>('nutriphiGoals')
				.toArray()
				.then((all) => all.filter((g) => !g.deletedAt));
		}).subscribe((val) => {
			goals = val ?? [];
		});
		return () => sub.unsubscribe();
	});

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

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
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

	<!-- Macros -->
	<div class="flex justify-center gap-4 text-xs text-white/40">
		<span>{Math.round(totalProtein)}g Protein</span>
		<span>{todayMeals.length} Mahlzeiten</span>
	</div>

	<!-- Today's meals -->
	<div class="flex-1 overflow-auto">
		{#each todayMeals as meal (meal.id)}
			<div class="mb-1 min-h-[44px] rounded-md px-3 py-2 transition-colors hover:bg-white/5">
				<div class="flex items-center justify-between">
					<span class="text-xs text-white/50">{mealTypeLabels[meal.mealType] ?? meal.mealType}</span
					>
					{#if meal.nutrition}
						<span class="text-xs text-white/50">{Math.round(meal.nutrition.calories)} kcal</span>
					{/if}
				</div>
				<p class="truncate text-sm text-white/70">{meal.description}</p>
			</div>
		{/each}

		{#if todayMeals.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Noch keine Mahlzeiten heute</p>
		{/if}
	</div>
</div>
