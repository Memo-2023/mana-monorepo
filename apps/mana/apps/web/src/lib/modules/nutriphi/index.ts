/**
 * NutriPhi module — barrel exports.
 */

export { mealTable, goalTable, nutriFavoriteTable, NUTRIPHI_GUEST_SEED } from './collections';
export * from './queries';
export { mealMutations, photoMutations, textAnalysisMutations } from './mutations';
export type {
	CreateMealDto,
	CreateMealFromPhotoDto,
	UpdateMealDto,
	PhotoAnalysisOutcome,
} from './mutations';
export type { UploadMealPhotoResult, MealAnalysisResult } from './api';
export type {
	LocalMeal,
	LocalGoal,
	LocalFavorite,
	MealType,
	InputType,
	NutritionData,
	AnalyzedFood,
	NutritionProgress,
	DailySummary,
	MealWithNutrition,
} from './types';
