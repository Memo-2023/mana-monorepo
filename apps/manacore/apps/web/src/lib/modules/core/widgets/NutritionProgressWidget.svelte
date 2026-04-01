<script lang="ts">
	/**
	 * NutritionProgressWidget — Heutiger Kalorienfortschritt.
	 *
	 * Liest direkt aus der unified IndexedDB (meals + goals tables).
	 * Zeigt einen Fortschrittsbalken zum Tagesziel.
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { BaseRecord } from '@manacore/local-store';

	interface Meal extends BaseRecord {
		date: string;
		mealType: string;
		description: string;
		nutrition?: {
			calories: number;
			protein: number;
			carbohydrates: number;
			fat: number;
		} | null;
	}

	interface Goal extends BaseRecord {
		dailyCalories: number;
		dailyProtein?: number | null;
		dailyCarbs?: number | null;
		dailyFat?: number | null;
	}

	const DEFAULT_CALORIES = 2000;
	const todayStr = new Date().toISOString().split('T')[0];

	let totalCalories = $state(0);
	let targetCalories = $state(DEFAULT_CALORIES);
	let totalProtein = $state(0);
	let totalCarbs = $state(0);
	let totalFat = $state(0);
	let mealCount = $state(0);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const [meals, goals] = await Promise.all([
				db.table<Meal>('meals').toArray(),
				db.table<Goal>('goals').toArray(),
			]);

			const todayMeals = meals.filter((m) => {
				if (m.deletedAt) return false;
				return String(m.date).split('T')[0] === todayStr;
			});

			const cals = todayMeals.reduce((sum, m) => sum + (m.nutrition?.calories || 0), 0);
			const prot = todayMeals.reduce((sum, m) => sum + (m.nutrition?.protein || 0), 0);
			const carbs = todayMeals.reduce((sum, m) => sum + (m.nutrition?.carbohydrates || 0), 0);
			const fat = todayMeals.reduce((sum, m) => sum + (m.nutrition?.fat || 0), 0);

			const activeGoal = goals.find((g) => !g.deletedAt);
			const target = activeGoal?.dailyCalories || DEFAULT_CALORIES;

			return { cals, prot, carbs, fat, target, count: todayMeals.length };
		}).subscribe({
			next: (val) => {
				totalCalories = Math.round(val.cals);
				totalProtein = Math.round(val.prot);
				totalCarbs = Math.round(val.carbs);
				totalFat = Math.round(val.fat);
				targetCalories = val.target;
				mealCount = val.count;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const percentage = $derived(Math.min(Math.round((totalCalories / targetCalories) * 100), 100));

	// SVG circle progress
	const RADIUS = 36;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const strokeOffset = $derived(CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE);

	function getProgressColor(pct: number): string {
		if (pct < 50) return '#22c55e';
		if (pct < 80) return '#eab308';
		return '#f97316';
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Ernährung heute</h3>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-6">
			<div class="h-20 w-20 animate-pulse rounded-full bg-surface-hover"></div>
		</div>
	{:else if mealCount === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#127860;</div>
			<p class="text-sm text-muted-foreground">Noch keine Mahlzeiten erfasst.</p>
			<a
				href="/nutriphi"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Mahlzeit erfassen
			</a>
		</div>
	{:else}
		<a href="/nutriphi" class="block rounded-lg p-2 transition-colors hover:bg-surface-hover">
			<!-- Progress Ring -->
			<div class="mb-3 flex items-center justify-center">
				<div class="relative">
					<svg width="88" height="88" viewBox="0 0 88 88" class="-rotate-90">
						<circle
							cx="44"
							cy="44"
							r={RADIUS}
							fill="none"
							stroke="currentColor"
							stroke-width="6"
							class="text-surface-hover"
						/>
						<circle
							cx="44"
							cy="44"
							r={RADIUS}
							fill="none"
							stroke={getProgressColor(percentage)}
							stroke-width="6"
							stroke-linecap="round"
							stroke-dasharray={CIRCUMFERENCE}
							stroke-dashoffset={strokeOffset}
							class="transition-all duration-500"
						/>
					</svg>
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<span class="text-lg font-bold">{percentage}%</span>
					</div>
				</div>
			</div>

			<!-- Stats -->
			<div class="text-center text-sm">
				<p class="font-medium">
					{totalCalories} / {targetCalories} kcal
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{mealCount} Mahlzeit{mealCount !== 1 ? 'en' : ''}
				</p>
			</div>

			<!-- Macros -->
			<div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
				<div>
					<p class="font-semibold text-red-400">{totalProtein}g</p>
					<p class="text-muted-foreground">Protein</p>
				</div>
				<div>
					<p class="font-semibold text-blue-400">{totalCarbs}g</p>
					<p class="text-muted-foreground">Carbs</p>
				</div>
				<div>
					<p class="font-semibold text-purple-400">{totalFat}g</p>
					<p class="text-muted-foreground">Fett</p>
				</div>
			</div>
		</a>
	{/if}
</div>
