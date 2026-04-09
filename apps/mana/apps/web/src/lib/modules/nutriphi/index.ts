/**
 * NutriPhi module — barrel exports.
 */

export { mealTable, goalTable, nutriFavoriteTable, NUTRIPHI_GUEST_SEED } from './collections';
export * from './queries';
export { mealMutations, photoMutations, textAnalysisMutations } from './mutations';
export type { CreateMealDto, CreateMealFromPhotoDto, PhotoAnalysisOutcome } from './mutations';
export type { UploadMealPhotoResult, MealAnalysisResult, AnalyzedFood } from './api';
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
