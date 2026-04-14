/**
 * Food module types for the unified app.
 *
 * NutritionData and AnalyzedFood are re-exported from @mana/shared-types
 * because they double as the AI wire format (same Zod schema lives in
 * packages/shared-types/src/ai-schemas.ts and is used by the backend
 * generateObject() validator). Module-local types like LocalMeal compose
 * those shared shapes with storage-specific BaseRecord fields.
 */

import type { BaseRecord } from '@mana/local-store';
import type { NutritionData, AnalyzedFood } from '@mana/shared-types';

export type { NutritionData, AnalyzedFood };

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputType = 'photo' | 'text';

export interface LocalMeal extends BaseRecord {
	date: string;
	mealType: MealType;
	inputType: InputType;
	description: string;
	portionSize?: string | null;
	confidence: number;
	nutrition?: NutritionData | null;
	photoMediaId?: string | null;
	/** Full-resolution media URL — used in the detail view + lightbox. */
	photoUrl?: string | null;
	/** Pre-generated thumbnail URL — used in list views to save bandwidth. */
	photoThumbnailUrl?: string | null;
	/** AI-identified individual food items. Encrypted (food names = user content). */
	foods?: AnalyzedFood[] | null;
}

export interface LocalGoal extends BaseRecord {
	dailyCalories: number;
	dailyProtein?: number | null;
	dailyCarbs?: number | null;
	dailyFat?: number | null;
	dailyFiber?: number | null;
}

export interface LocalFavorite extends BaseRecord {
	name: string;
	description: string;
	mealType: MealType;
	nutrition: NutritionData;
	usageCount: number;
}

export interface NutritionProgress {
	calories: { current: number; target: number; percentage: number };
	protein: { current: number; target: number; percentage: number };
	carbs: { current: number; target: number; percentage: number };
	fat: { current: number; target: number; percentage: number };
}

export interface DailySummary {
	date: Date;
	meals: MealWithNutrition[];
	totalNutrition: NutritionData;
	progress: NutritionProgress;
}

export interface MealWithNutrition {
	id: string;
	date: string;
	mealType: MealType;
	inputType: InputType;
	description: string;
	portionSize?: string | null;
	confidence: number;
	nutrition: NutritionData | null;
	photoMediaId?: string | null;
	photoUrl?: string | null;
	photoThumbnailUrl?: string | null;
	foods?: AnalyzedFood[] | null;
	createdAt: string;
}
