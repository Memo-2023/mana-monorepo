import type { MealNutrition, NutritionProgress, UserGoals } from '../types/nutrition.types';
import { DEFAULT_DAILY_VALUES } from '../types/nutrition.types';

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
