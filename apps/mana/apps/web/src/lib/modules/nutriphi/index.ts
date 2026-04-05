/**
 * NutriPhi module — barrel exports.
 */

export { mealTable, goalTable, nutriFavoriteTable, NUTRIPHI_GUEST_SEED } from './collections';
export * from './queries';
export type {
	LocalMeal,
	LocalGoal,
	LocalFavorite,
	MealType,
	InputType,
	NutritionData,
	NutritionProgress,
	DailySummary,
	MealWithNutrition,
} from './types';
