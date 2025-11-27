/**
 * Meal Types for Nutriphi Web
 * Based on mobile app data model
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type AnalysisStatus = 'pending' | 'completed' | 'failed' | 'manual';
export type HealthCategory = 'very_healthy' | 'healthy' | 'moderate' | 'unhealthy';
export type FoodCategory =
	| 'protein'
	| 'vegetable'
	| 'grain'
	| 'fruit'
	| 'dairy'
	| 'fat'
	| 'processed'
	| 'beverage';

export interface Meal {
	id: string;
	user_id: string;
	photo_path: string;
	photo_url?: string;
	timestamp: string;
	meal_type: MealType;
	location?: string;
	analysis_status: AnalysisStatus;
	total_calories?: number;
	total_protein?: number;
	total_carbs?: number;
	total_fat?: number;
	total_fiber?: number;
	total_sugar?: number;
	health_score?: number;
	health_category?: HealthCategory;
	user_notes?: string;
	user_rating?: number;
	created_at: string;
	updated_at: string;
}

export interface FoodItem {
	id: string;
	meal_id: string;
	name: string;
	category: FoodCategory;
	portion_size: string;
	calories?: number;
	protein?: number;
	carbs?: number;
	fat?: number;
	fiber?: number;
	sugar?: number;
	confidence?: number;
}

export interface MealWithItems extends Meal {
	food_items: FoodItem[];
}

export interface DailySummary {
	date: string;
	totalCalories: number;
	totalProtein: number;
	totalCarbs: number;
	totalFat: number;
	totalFiber: number;
	totalSugar: number;
	mealCount: number;
	avgHealthScore: number;
}

export interface MealFilters {
	date?: string;
	mealType?: MealType;
	minHealthScore?: number;
}
