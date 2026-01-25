import { DEFAULT_DAILY_VALUES, NUTRIENT_INFO } from '../constants';
import type { MealNutrition, NutritionProgress, UserGoals } from '../types';

/**
 * Calculate nutrition progress towards daily goals
 */
export function calculateProgress(
	totalNutrition: Partial<MealNutrition>,
	goals?: UserGoals
): NutritionProgress {
	const targetCalories = goals?.dailyCalories ?? DEFAULT_DAILY_VALUES.calories;
	const targetProtein = goals?.dailyProtein ?? DEFAULT_DAILY_VALUES.protein;
	const targetCarbs = goals?.dailyCarbs ?? DEFAULT_DAILY_VALUES.carbohydrates;
	const targetFat = goals?.dailyFat ?? DEFAULT_DAILY_VALUES.fat;

	return {
		calories: {
			current: totalNutrition.calories ?? 0,
			target: targetCalories,
			percentage: Math.min(
				100,
				Math.round(((totalNutrition.calories ?? 0) / targetCalories) * 100)
			),
		},
		protein: {
			current: totalNutrition.protein ?? 0,
			target: targetProtein,
			percentage: Math.min(100, Math.round(((totalNutrition.protein ?? 0) / targetProtein) * 100)),
		},
		carbs: {
			current: totalNutrition.carbohydrates ?? 0,
			target: targetCarbs,
			percentage: Math.min(
				100,
				Math.round(((totalNutrition.carbohydrates ?? 0) / targetCarbs) * 100)
			),
		},
		fat: {
			current: totalNutrition.fat ?? 0,
			target: targetFat,
			percentage: Math.min(100, Math.round(((totalNutrition.fat ?? 0) / targetFat) * 100)),
		},
	};
}

/**
 * Sum up nutrition from multiple meals
 */
export function sumNutrition(
	meals: Array<{ nutrition?: Partial<MealNutrition> | null }>
): Partial<MealNutrition> {
	const sum = {
		calories: 0,
		protein: 0,
		carbohydrates: 0,
		fat: 0,
		fiber: 0,
		sugar: 0,
	};

	for (const meal of meals) {
		if (!meal.nutrition) continue;
		const n = meal.nutrition;
		if (typeof n.calories === 'number') sum.calories += n.calories;
		if (typeof n.protein === 'number') sum.protein += n.protein;
		if (typeof n.carbohydrates === 'number') sum.carbohydrates += n.carbohydrates;
		if (typeof n.fat === 'number') sum.fat += n.fat;
		if (typeof n.fiber === 'number') sum.fiber += n.fiber;
		if (typeof n.sugar === 'number') sum.sugar += n.sugar;
	}

	return sum;
}

/**
 * Format nutrient value with unit
 */
export function formatNutrient(
	nutrient: keyof typeof NUTRIENT_INFO,
	value: number | undefined
): string {
	if (value === undefined) return '-';
	const info = NUTRIENT_INFO[nutrient];
	if (!info) return `${value}`;

	if (nutrient === 'calories') {
		return `${Math.round(value)} ${info.unit}`;
	}

	return `${value.toFixed(1)} ${info.unit}`;
}

/**
 * Get color for progress percentage
 */
export function getProgressColor(percentage: number): string {
	if (percentage < 50) return '#EF4444'; // Red
	if (percentage < 80) return '#F59E0B'; // Orange
	if (percentage <= 100) return '#22C55E'; // Green
	return '#EF4444'; // Red (over target)
}

/**
 * Detect deficiencies based on daily values
 */
export function detectDeficiencies(
	totalNutrition: Partial<MealNutrition>
): Array<{ nutrient: string; percentage: number; label: string }> {
	const deficiencies: Array<{ nutrient: string; percentage: number; label: string }> = [];

	const checks = [
		{ key: 'protein', threshold: 0.5 },
		{ key: 'fiber', threshold: 0.5 },
		{ key: 'vitaminC', threshold: 0.5 },
		{ key: 'vitaminD', threshold: 0.5 },
		{ key: 'iron', threshold: 0.5 },
		{ key: 'calcium', threshold: 0.5 },
	] as const;

	for (const check of checks) {
		const value = totalNutrition[check.key as keyof typeof totalNutrition];
		const dailyValue = DEFAULT_DAILY_VALUES[check.key as keyof typeof DEFAULT_DAILY_VALUES];

		if (
			typeof value === 'number' &&
			typeof dailyValue === 'number' &&
			value < dailyValue * check.threshold
		) {
			const info = NUTRIENT_INFO[check.key as keyof typeof NUTRIENT_INFO];
			deficiencies.push({
				nutrient: check.key,
				percentage: Math.round((value / dailyValue) * 100),
				label: info?.label ?? check.key,
			});
		}
	}

	return deficiencies;
}

/**
 * Get meal type based on current time
 */
export function suggestMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
	const hour = new Date().getHours();

	if (hour >= 5 && hour < 11) return 'breakfast';
	if (hour >= 11 && hour < 14) return 'lunch';
	if (hour >= 17 && hour < 21) return 'dinner';
	return 'snack';
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date, locale = 'de-DE'): string {
	return new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(date);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}
