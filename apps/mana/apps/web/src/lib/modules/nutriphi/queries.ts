/**
 * Reactive queries & pure helpers for NutriPhi — uses Dexie liveQuery on the unified DB.
 *
 * Uses table names: meals, goals, nutriFavorites.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalMeal,
	LocalGoal,
	LocalFavorite,
	MealWithNutrition,
	NutritionData,
	NutritionProgress,
	DailySummary,
} from './types';
import { DEFAULT_DAILY_VALUES } from './constants';

// ─── Type Converters ───────────────────────────────────────

export function toMealWithNutrition(local: LocalMeal): MealWithNutrition {
	return {
		id: local.id,
		date: local.date,
		mealType: local.mealType,
		inputType: local.inputType,
		description: local.description,
		portionSize: local.portionSize,
		confidence: local.confidence,
		nutrition: local.nutrition ?? null,
		photoMediaId: local.photoMediaId ?? null,
		photoUrl: local.photoUrl ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All meals, auto-updates on any change. */
export function useAllMeals() {
	return liveQuery(async () => {
		const locals = await db.table<LocalMeal>('meals').toArray();
		const visible = locals.filter((m) => !m.deletedAt);
		const decrypted = await decryptRecords('meals', visible);
		return decrypted.map(toMealWithNutrition);
	});
}

/** All goals, auto-updates on any change. */
export function useAllGoals() {
	return liveQuery(async () => {
		const locals = await db.table<LocalGoal>('goals').toArray();
		return locals.filter((g) => !g.deletedAt);
	});
}

/** All favorites, auto-updates on any change. */
export function useAllFavorites() {
	return liveQuery(async () => {
		const locals = await db.table<LocalFavorite>('nutriFavorites').toArray();
		return locals.filter((f) => !f.deletedAt);
	});
}

// ─── Pure Filter/Helper Functions (for $derived) ──────────

/** Get today's date as YYYY-MM-DD string. */
export function getTodayStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Filter meals for a specific date string (YYYY-MM-DD). */
export function filterByDate(meals: MealWithNutrition[], dateStr: string): MealWithNutrition[] {
	return meals.filter((m) => {
		const mealDate = String(m.date).split('T')[0];
		return mealDate === dateStr;
	});
}

/** Filter meals for today, sorted by creation time. */
export function getTodaysMeals(meals: MealWithNutrition[]): MealWithNutrition[] {
	const today = getTodayStr();
	return filterByDate(meals, today).sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	);
}

/** Sum nutrition values across a set of meals. */
export function sumNutrition(meals: MealWithNutrition[]): NutritionData {
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

	const calorieTarget = goals?.dailyCalories ?? DEFAULT_DAILY_VALUES.calories;
	const proteinTarget = goals?.dailyProtein ?? DEFAULT_DAILY_VALUES.protein;
	const carbsTarget = goals?.dailyCarbs ?? DEFAULT_DAILY_VALUES.carbohydrates;
	const fatTarget = goals?.dailyFat ?? DEFAULT_DAILY_VALUES.fat;

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
	};
}

/** Search meals by description. */
export function searchMeals(meals: MealWithNutrition[], query: string): MealWithNutrition[] {
	const q = query.toLowerCase();
	return meals.filter((m) => m.description?.toLowerCase().includes(q));
}
