/**
 * Reactive Queries & Pure Helpers for NutriPhi
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	mealCollection,
	goalCollection,
	favoriteCollection,
	type LocalMeal,
	type LocalGoal,
	type LocalFavorite,
} from './local-store';
import type { Meal, MealNutrition, DailySummary, NutritionProgress } from '@nutriphi/shared';

// ─── Extended Types ────────────────────────────────────────

export interface MealWithNutrition extends Meal {
	nutrition: MealNutrition | null;
}

// ─── Type Converters ───────────────────────────────────────

export function toMealWithNutrition(local: LocalMeal): MealWithNutrition {
	return {
		id: local.id,
		userId: 'local',
		date: new Date(local.date),
		mealType: local.mealType as any,
		inputType: local.inputType as any,
		description: local.description,
		portionSize: local.portionSize ?? undefined,
		confidence: local.confidence,
		createdAt: new Date(local.createdAt ?? Date.now()),
		nutrition: local.nutrition
			? {
					id: local.id,
					mealId: local.id,
					calories: local.nutrition.calories,
					protein: local.nutrition.protein,
					carbohydrates: local.nutrition.carbohydrates,
					fat: local.nutrition.fat,
					fiber: local.nutrition.fiber,
					sugar: local.nutrition.sugar,
				}
			: null,
	} as MealWithNutrition;
}

// ─── Live Query Hooks (call during component init) ─────────

/** All meals, auto-updates on any change. */
export function useAllMeals() {
	return useLiveQueryWithDefault(async () => {
		const locals = await mealCollection.getAll();
		return locals.map(toMealWithNutrition);
	}, [] as MealWithNutrition[]);
}

/** All goals, auto-updates on any change. */
export function useAllGoals() {
	return useLiveQueryWithDefault(async () => {
		return await goalCollection.getAll();
	}, [] as LocalGoal[]);
}

/** All favorites, auto-updates on any change. */
export function useAllFavorites() {
	return useLiveQueryWithDefault(async () => {
		return await favoriteCollection.getAll();
	}, [] as LocalFavorite[]);
}

// ─── Pure Filter/Helper Functions (for $derived) ──────────

/** Filter meals for a specific date string (YYYY-MM-DD). */
export function filterByDate(meals: MealWithNutrition[], dateStr: string): MealWithNutrition[] {
	return meals.filter((m) => {
		const mealDate =
			m.date instanceof Date ? m.date.toISOString().split('T')[0] : String(m.date).split('T')[0];
		return mealDate === dateStr;
	});
}

/** Get today's date as YYYY-MM-DD string. */
export function getTodayStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Filter meals for today, sorted by creation time. */
export function getTodaysMeals(meals: MealWithNutrition[]): MealWithNutrition[] {
	const today = getTodayStr();
	return filterByDate(meals, today).sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	);
}

/** Sum nutrition values across a set of meals. */
export function sumNutrition(meals: MealWithNutrition[]): {
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
} {
	return meals.reduce(
		(acc, m) => ({
			calories: acc.calories + (m.nutrition?.calories || 0),
			protein: acc.protein + (m.nutrition?.protein || 0),
			carbohydrates: acc.carbohydrates + (m.nutrition?.carbohydrates || 0),
			fat: acc.fat + (m.nutrition?.fat || 0),
			fiber: acc.fiber + (m.nutrition?.fiber || 0),
			sugar: acc.sugar + (m.nutrition?.sugar || 0),
		}),
		{ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
	);
}

/** Build a DailySummary from meals for a given date. */
export function getDailySummary(
	meals: MealWithNutrition[],
	date?: Date,
	goals?: LocalGoal | null
): DailySummary {
	const dateStr = (date || new Date()).toISOString().split('T')[0];
	const dayMeals = filterByDate(meals, dateStr);
	const totalNutrition = sumNutrition(dayMeals);

	const calorieTarget = goals?.dailyCalories ?? 2000;
	const proteinTarget = goals?.dailyProtein ?? 50;
	const carbsTarget = goals?.dailyCarbs ?? 250;
	const fatTarget = goals?.dailyFat ?? 65;

	const progress: NutritionProgress = {
		calories: {
			current: Math.round(totalNutrition.calories),
			target: calorieTarget,
			percentage: Math.min(Math.round((totalNutrition.calories / calorieTarget) * 100), 100),
		},
		protein: {
			current: Math.round(totalNutrition.protein),
			target: proteinTarget,
			percentage: Math.min(Math.round((totalNutrition.protein / proteinTarget) * 100), 100),
		},
		carbs: {
			current: Math.round(totalNutrition.carbohydrates),
			target: carbsTarget,
			percentage: Math.min(Math.round((totalNutrition.carbohydrates / carbsTarget) * 100), 100),
		},
		fat: {
			current: Math.round(totalNutrition.fat),
			target: fatTarget,
			percentage: Math.min(Math.round((totalNutrition.fat / fatTarget) * 100), 100),
		},
	};

	return {
		date: new Date(dateStr),
		meals: dayMeals,
		totalNutrition,
		progress,
	} as DailySummary;
}

/** Search meals by description. */
export function searchMeals(meals: MealWithNutrition[], query: string): MealWithNutrition[] {
	const q = query.toLowerCase();
	return meals.filter((m) => m.description?.toLowerCase().includes(q));
}
