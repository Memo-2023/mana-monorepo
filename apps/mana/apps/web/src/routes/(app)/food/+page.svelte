<script lang="ts">
	import {
		useAllMeals,
		useAllGoals,
		getTodaysMeals,
		getDailySummary,
	} from '$lib/modules/food/queries';
	import { MEAL_TYPE_LABELS, NUTRIENT_INFO, suggestMealType } from '$lib/modules/food/constants';
	import type { MealWithNutrition, NutritionProgress } from '$lib/modules/food/types';
	import { Plus, Clock, Fire } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';

	const allMeals = useAllMeals();
	const allGoals = useAllGoals();

	let meals = $derived(allMeals.value);
	let goals = $derived(allGoals.value[0] ?? null);

	let todaysMeals = $derived(getTodaysMeals(meals));
	let dailySummary = $derived(getDailySummary(meals, undefined, goals));
	let progress = $derived(dailySummary.progress);

	function getMealTypeLabel(type: string): string {
		return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS]?.de ?? type;
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString(get(locale) ?? 'de', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getProgressColor(percentage: number): string {
		if (percentage >= 100) return 'bg-green-500';
		if (percentage >= 75) return 'bg-blue-500';
		if (percentage >= 50) return 'bg-yellow-500';
		return 'bg-muted';
	}
</script>

<svelte:head>
	<title>{$_('food.home.page_title_html')}</title>
</svelte:head>

<RoutePage appId="food">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">
					{$_('food.home.heading_today')}
				</h1>
				<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
					{new Date().toLocaleDateString(get(locale) ?? 'de', {
						weekday: 'long',
						day: 'numeric',
						month: 'long',
					})}
				</p>
			</div>
			<div class="flex gap-2">
				<a
					href="/food/history"
					class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-foreground))] transition-colors hover:bg-[hsl(var(--color-muted))]"
				>
					{$_('food.home.action_history')}
				</a>
				<a
					href="/food/add"
					class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] transition-colors hover:opacity-90"
				>
					<Plus size={16} />
					{$_('food.home.action_meal')}
				</a>
			</div>
		</div>

		<!-- Progress Cards -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<!-- Calories -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full"
						style="background-color: {NUTRIENT_INFO.calories.color}"
					></div>
					<span class="text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
						>{$_('food.nutrition.calories')}</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold text-[hsl(var(--color-foreground))]">
					{progress.calories.current}
				</p>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
					/ {progress.calories.target} kcal
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
					<div
						class="h-full rounded-full transition-[width] {getProgressColor(
							progress.calories.percentage
						)}"
						style="width: {Math.min(progress.calories.percentage, 100)}%"
					></div>
				</div>
			</div>

			<!-- Protein -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full"
						style="background-color: {NUTRIENT_INFO.protein.color}"
					></div>
					<span class="text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
						>{$_('food.nutrition.protein')}</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold text-[hsl(var(--color-foreground))]">
					{progress.protein.current}g
				</p>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
					/ {progress.protein.target}g
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
					<div
						class="h-full rounded-full transition-[width] {getProgressColor(
							progress.protein.percentage
						)}"
						style="width: {Math.min(progress.protein.percentage, 100)}%"
					></div>
				</div>
			</div>

			<!-- Carbs -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full"
						style="background-color: {NUTRIENT_INFO.carbohydrates.color}"
					></div>
					<span class="text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
						>{$_('food.nutrition.carbs')}</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold text-[hsl(var(--color-foreground))]">
					{progress.carbs.current}g
				</p>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
					/ {progress.carbs.target}g
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
					<div
						class="h-full rounded-full transition-[width] {getProgressColor(
							progress.carbs.percentage
						)}"
						style="width: {Math.min(progress.carbs.percentage, 100)}%"
					></div>
				</div>
			</div>

			<!-- Fat -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full"
						style="background-color: {NUTRIENT_INFO.fat.color}"
					></div>
					<span class="text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
						>{$_('food.nutrition.fat')}</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold text-[hsl(var(--color-foreground))]">
					{progress.fat.current}g
				</p>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
					/ {progress.fat.target}g
				</p>
				<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
					<div
						class="h-full rounded-full transition-[width] {getProgressColor(
							progress.fat.percentage
						)}"
						style="width: {Math.min(progress.fat.percentage, 100)}%"
					></div>
				</div>
			</div>
		</div>

		<!-- Today's Meals -->
		<div>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[hsl(var(--color-foreground))]">
					{$_('food.home.section_today_meals')}
				</h2>
				<span class="text-sm text-[hsl(var(--color-muted-foreground))]">
					{$_('food.home.entries_count', { values: { n: todaysMeals.length } })}
				</span>
			</div>

			{#if todaysMeals.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-12"
				>
					<span class="mb-4 text-5xl">🍽️</span>
					<h3 class="mb-2 text-lg font-semibold text-[hsl(var(--color-foreground))]">
						{$_('food.home.empty_no_meals')}
					</h3>
					<p class="mb-4 text-sm text-[hsl(var(--color-muted-foreground))]">
						{$_('food.home.empty_hint')}
					</p>
					<a
						href="/food/add"
						class="rounded-lg bg-[hsl(var(--color-primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
					>
						{$_('food.home.action_add_meal')}
					</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each todaysMeals as meal (meal.id)}
						<a
							href="/food/{meal.id}"
							class="block rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
						>
							<div class="flex items-start gap-3">
								{#if meal.photoThumbnailUrl || meal.photoUrl}
									<img
										src={meal.photoThumbnailUrl ?? meal.photoUrl}
										alt={meal.description}
										class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
										loading="lazy"
									/>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="rounded-full bg-[hsl(var(--color-muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
										>
											{getMealTypeLabel(meal.mealType)}
										</span>
										<span class="text-xs text-[hsl(var(--color-muted-foreground))]">
											{formatTime(meal.createdAt)}
										</span>
										{#if meal.inputType === 'photo'}
											<span class="text-xs text-[hsl(var(--color-muted-foreground))]">📷</span>
										{/if}
									</div>
									<p class="mt-1 font-medium text-[hsl(var(--color-foreground))]">
										{meal.description}
									</p>

									{#if meal.nutrition}
										<div
											class="mt-2 flex flex-wrap gap-3 text-xs text-[hsl(var(--color-muted-foreground))]"
										>
											<span>{meal.nutrition.calories} kcal</span>
											<span
												>{$_('food.home.macro_protein', {
													values: { n: meal.nutrition.protein },
												})}</span
											>
											<span
												>{$_('food.home.macro_carbs', {
													values: { n: meal.nutrition.carbohydrates },
												})}</span
											>
											<span
												>{$_('food.home.macro_fat', {
													values: { n: meal.nutrition.fat },
												})}</span
											>
										</div>
									{/if}
								</div>

								{#if meal.nutrition}
									<span class="text-lg font-bold text-[hsl(var(--color-foreground))]">
										{meal.nutrition.calories}
										<span class="text-xs font-normal text-[hsl(var(--color-muted-foreground))]"
											>kcal</span
										>
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Quick Links -->
		<div class="flex gap-3">
			<a
				href="/food/goals"
				class="flex-1 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 text-center transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
			>
				<span class="text-2xl">🎯</span>
				<p class="mt-1 text-sm font-medium text-[hsl(var(--color-foreground))]">
					{$_('food.home.link_goals')}
				</p>
			</a>
			<a
				href="/food/history"
				class="flex-1 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 text-center transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
			>
				<span class="text-2xl">📊</span>
				<p class="mt-1 text-sm font-medium text-[hsl(var(--color-foreground))]">
					{$_('food.home.action_history')}
				</p>
			</a>
		</div>
	</div>
</RoutePage>
