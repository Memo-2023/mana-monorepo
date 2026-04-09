<script lang="ts">
	import {
		useAllMeals,
		useAllGoals,
		getTodaysMeals,
		getDailySummary,
	} from '$lib/modules/nutriphi/queries';
	import {
		MEAL_TYPE_LABELS,
		NUTRIENT_INFO,
		suggestMealType,
	} from '$lib/modules/nutriphi/constants';
	import type { MealWithNutrition, NutritionProgress } from '$lib/modules/nutriphi/types';
	import { Plus, Clock, Fire } from '@mana/shared-icons';

	const allMeals = useAllMeals();
	const allGoals = useAllGoals();

	let meals = $derived(allMeals.current ?? []);
	let goals = $derived((allGoals.current ?? [])[0] ?? null);

	let todaysMeals = $derived(getTodaysMeals(meals));
	let dailySummary = $derived(getDailySummary(meals, undefined, goals));
	let progress = $derived(dailySummary.progress);

	function getMealTypeLabel(type: string): string {
		return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS]?.de ?? type;
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getProgressColor(percentage: number): string {
		if (percentage >= 100) return 'bg-green-500';
		if (percentage >= 75) return 'bg-blue-500';
		if (percentage >= 50) return 'bg-yellow-500';
		return 'bg-gray-400';
	}
</script>

<svelte:head>
	<title>NutriPhi - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Heute</h1>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/nutriphi/history"
				class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
			>
				Verlauf
			</a>
			<a
				href="/nutriphi/add"
				class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
			>
				<Plus size={16} />
				Mahlzeit
			</a>
		</div>
	</div>

	<!-- Progress Cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<!-- Calories -->
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<div class="flex items-center gap-2">
				<div
					class="h-2 w-2 rounded-full"
					style="background-color: {NUTRIENT_INFO.calories.color}"
				></div>
				<span class="text-xs font-medium text-[hsl(var(--muted-foreground))]">Kalorien</span>
			</div>
			<p class="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">
				{progress.calories.current}
			</p>
			<p class="text-xs text-[hsl(var(--muted-foreground))]">
				/ {progress.calories.target} kcal
			</p>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
				<div
					class="h-full rounded-full transition-all {getProgressColor(
						progress.calories.percentage
					)}"
					style="width: {Math.min(progress.calories.percentage, 100)}%"
				></div>
			</div>
		</div>

		<!-- Protein -->
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<div class="flex items-center gap-2">
				<div
					class="h-2 w-2 rounded-full"
					style="background-color: {NUTRIENT_INFO.protein.color}"
				></div>
				<span class="text-xs font-medium text-[hsl(var(--muted-foreground))]">Protein</span>
			</div>
			<p class="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">
				{progress.protein.current}g
			</p>
			<p class="text-xs text-[hsl(var(--muted-foreground))]">
				/ {progress.protein.target}g
			</p>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
				<div
					class="h-full rounded-full transition-all {getProgressColor(progress.protein.percentage)}"
					style="width: {Math.min(progress.protein.percentage, 100)}%"
				></div>
			</div>
		</div>

		<!-- Carbs -->
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<div class="flex items-center gap-2">
				<div
					class="h-2 w-2 rounded-full"
					style="background-color: {NUTRIENT_INFO.carbohydrates.color}"
				></div>
				<span class="text-xs font-medium text-[hsl(var(--muted-foreground))]">Kohlenhydrate</span>
			</div>
			<p class="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">
				{progress.carbs.current}g
			</p>
			<p class="text-xs text-[hsl(var(--muted-foreground))]">
				/ {progress.carbs.target}g
			</p>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
				<div
					class="h-full rounded-full transition-all {getProgressColor(progress.carbs.percentage)}"
					style="width: {Math.min(progress.carbs.percentage, 100)}%"
				></div>
			</div>
		</div>

		<!-- Fat -->
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 rounded-full" style="background-color: {NUTRIENT_INFO.fat.color}"></div>
				<span class="text-xs font-medium text-[hsl(var(--muted-foreground))]">Fett</span>
			</div>
			<p class="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">
				{progress.fat.current}g
			</p>
			<p class="text-xs text-[hsl(var(--muted-foreground))]">
				/ {progress.fat.target}g
			</p>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
				<div
					class="h-full rounded-full transition-all {getProgressColor(progress.fat.percentage)}"
					style="width: {Math.min(progress.fat.percentage, 100)}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Today's Meals -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Heutige Mahlzeiten</h2>
			<span class="text-sm text-[hsl(var(--muted-foreground))]">
				{todaysMeals.length} Eintraege
			</span>
		</div>

		{#if todaysMeals.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-12"
			>
				<span class="mb-4 text-5xl">🍽️</span>
				<h3 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">
					Noch keine Mahlzeiten
				</h3>
				<p class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
					Trage deine erste Mahlzeit ein.
				</p>
				<a
					href="/nutriphi/add"
					class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
				>
					Mahlzeit hinzufuegen
				</a>
			</div>
		{:else}
			<div class="space-y-3">
				{#each todaysMeals as meal (meal.id)}
					<div
						class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
					>
						<div class="flex items-start gap-3">
							{#if meal.photoUrl}
								<img
									src={meal.photoUrl}
									alt={meal.description}
									class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
									loading="lazy"
								/>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span
										class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]"
									>
										{getMealTypeLabel(meal.mealType)}
									</span>
									<span class="text-xs text-[hsl(var(--muted-foreground))]">
										{formatTime(meal.createdAt)}
									</span>
									{#if meal.inputType === 'photo'}
										<span class="text-xs text-[hsl(var(--muted-foreground))]">📷</span>
									{/if}
								</div>
								<p class="mt-1 font-medium text-[hsl(var(--foreground))]">
									{meal.description}
								</p>

								{#if meal.nutrition}
									<div
										class="mt-2 flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]"
									>
										<span>{meal.nutrition.calories} kcal</span>
										<span>{meal.nutrition.protein}g Protein</span>
										<span>{meal.nutrition.carbohydrates}g Carbs</span>
										<span>{meal.nutrition.fat}g Fett</span>
									</div>
								{/if}
							</div>

							{#if meal.nutrition}
								<span class="text-lg font-bold text-[hsl(var(--foreground))]">
									{meal.nutrition.calories}
									<span class="text-xs font-normal text-[hsl(var(--muted-foreground))]">kcal</span>
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Quick Links -->
	<div class="flex gap-3">
		<a
			href="/nutriphi/goals"
			class="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center transition-all hover:border-[hsl(var(--primary)/0.3)]"
		>
			<span class="text-2xl">🎯</span>
			<p class="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">Ziele</p>
		</a>
		<a
			href="/nutriphi/history"
			class="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center transition-all hover:border-[hsl(var(--primary)/0.3)]"
		>
			<span class="text-2xl">📊</span>
			<p class="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">Verlauf</p>
		</a>
	</div>
</div>
