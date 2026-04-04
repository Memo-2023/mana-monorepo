/**
 * NutriPhi module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputType = 'photo' | 'text';

export interface NutritionData {
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
}

export interface LocalMeal extends BaseRecord {
	date: string;
	mealType: MealType;
	inputType: InputType;
	description: string;
	portionSize?: string | null;
	confidence: number;
	nutrition?: NutritionData | null;
	photoMediaId?: string | null;
	photoUrl?: string | null;
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
	createdAt: string;
}
