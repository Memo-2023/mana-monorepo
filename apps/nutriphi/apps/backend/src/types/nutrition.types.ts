// User Goals
export interface UserGoals {
	id: string;
	userId: string;
	dailyCalories: number;
	dailyProtein?: number | null;
	dailyCarbs?: number | null;
	dailyFat?: number | null;
	dailyFiber?: number | null;
	createdAt: Date;
	updatedAt: Date;
}

// Meal Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputType = 'photo' | 'text';

// Meal
export interface Meal {
	id: string;
	userId: string;
	date: Date;
	mealType: MealType;
	inputType: InputType;
	description: string;
	portionSize?: string;
	confidence: number;
	createdAt: Date;
}

// Nutrition Data
export interface MealNutrition {
	id: string;
	mealId: string;
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
	saturatedFat?: number | null;
	unsaturatedFat?: number | null;
	vitaminA?: number | null;
	vitaminB1?: number | null;
	vitaminB2?: number | null;
	vitaminB3?: number | null;
	vitaminB5?: number | null;
	vitaminB6?: number | null;
	vitaminB7?: number | null;
	vitaminB9?: number | null;
	vitaminB12?: number | null;
	vitaminC?: number | null;
	vitaminD?: number | null;
	vitaminE?: number | null;
	vitaminK?: number | null;
	calcium?: number | null;
	iron?: number | null;
	magnesium?: number | null;
	phosphorus?: number | null;
	potassium?: number | null;
	sodium?: number | null;
	zinc?: number | null;
	copper?: number | null;
	manganese?: number | null;
	selenium?: number | null;
	water?: number | null;
}

// Daily Summary
export interface DailySummary {
	date: Date;
	meals: Meal[];
	totalNutrition: Omit<MealNutrition, 'id' | 'mealId'>;
	goals?: UserGoals;
	progress: NutritionProgress;
}

export interface NutritionProgress {
	calories: { current: number; target: number; percentage: number };
	protein?: { current: number; target: number; percentage: number };
	carbs?: { current: number; target: number; percentage: number };
	fat?: { current: number; target: number; percentage: number };
}

// Weekly Stats
export interface WeeklyStats {
	startDate: Date;
	endDate: Date;
	days: DailyStats[];
	averages: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
	trends: {
		caloriesTrend: 'up' | 'down' | 'stable';
		proteinTrend: 'up' | 'down' | 'stable';
	};
}

export interface DailyStats {
	date: Date;
	totalCalories: number;
	totalProtein: number;
	totalCarbs: number;
	totalFat: number;
	mealCount: number;
	goalsMet: boolean;
}

// AI Analysis
export interface AIAnalysisResult {
	foods: DetectedFood[];
	totalNutrition: Omit<MealNutrition, 'id' | 'mealId'>;
	description: string;
	confidence: number;
	warnings?: string[];
	suggestions?: string[];
}

export interface DetectedFood {
	name: string;
	quantity: string;
	calories: number;
	confidence: number;
	source?: 'usda' | 'openfoodfacts' | 'ai_estimate';
}

// Default daily values
export const DEFAULT_DAILY_VALUES = {
	calories: 2000,
	protein: 50,
	carbohydrates: 300,
	fat: 65,
	fiber: 25,
	sugar: 50,
	vitaminC: 90,
	vitaminD: 20,
	iron: 18,
	calcium: 1000,
};
