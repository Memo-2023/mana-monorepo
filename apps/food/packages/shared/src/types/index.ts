// User Goals
export interface UserGoals {
	id: string;
	userId: string;
	dailyCalories: number;
	dailyProtein?: number | null; // in grams
	dailyCarbs?: number | null;
	dailyFat?: number | null;
	dailyFiber?: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateUserGoalsDto {
	dailyCalories: number;
	dailyProtein?: number;
	dailyCarbs?: number;
	dailyFat?: number;
	dailyFiber?: number;
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
	description: string; // AI-generated description of the meal
	portionSize?: string; // e.g., "small", "medium", "large" or grams
	confidence: number; // AI confidence score 0-1
	createdAt: Date;
}

export interface CreateMealDto {
	mealType: MealType;
	inputType: InputType;
	description?: string; // For text input
	imageBase64?: string; // For photo input
	portionSize?: string;
}

// Nutrition Data
export interface MealNutrition {
	id: string;
	mealId: string;
	// Macros
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
	saturatedFat?: number | null;
	unsaturatedFat?: number | null;
	// Vitamins (in mg or µg as appropriate)
	vitaminA?: number | null; // µg RAE
	vitaminB1?: number | null; // mg (Thiamin)
	vitaminB2?: number | null; // mg (Riboflavin)
	vitaminB3?: number | null; // mg (Niacin)
	vitaminB5?: number | null; // mg (Pantothenic acid)
	vitaminB6?: number | null; // mg
	vitaminB7?: number | null; // µg (Biotin)
	vitaminB9?: number | null; // µg (Folate)
	vitaminB12?: number | null; // µg
	vitaminC?: number | null; // mg
	vitaminD?: number | null; // µg
	vitaminE?: number | null; // mg
	vitaminK?: number | null; // µg
	// Minerals (in mg)
	calcium?: number | null;
	iron?: number | null;
	magnesium?: number | null;
	phosphorus?: number | null;
	potassium?: number | null;
	sodium?: number | null;
	zinc?: number | null;
	copper?: number | null;
	manganese?: number | null;
	selenium?: number | null; // µg
	// Water
	water?: number | null; // ml
}

// Favorite Meals
export interface FavoriteMeal {
	id: string;
	userId: string;
	name: string;
	description: string;
	mealType: MealType;
	nutrition: Omit<MealNutrition, 'id' | 'mealId'>;
	usageCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateFavoriteMealDto {
	name: string;
	mealId?: string; // Create from existing meal
	description?: string;
	mealType?: MealType;
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

// Recommendations
export type RecommendationType = 'hint' | 'coaching';
export type RecommendationPriority = 'low' | 'medium' | 'high';

export interface Recommendation {
	id: string;
	userId: string;
	date: Date;
	type: RecommendationType;
	priority: RecommendationPriority;
	message: string;
	nutrient?: string; // e.g., 'protein', 'vitaminC'
	actionable?: string; // e.g., "Add more leafy greens"
	dismissed: boolean;
	createdAt: Date;
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

// AI Analysis Response
export interface AIAnalysisResult {
	foods: DetectedFood[];
	totalNutrition: Omit<MealNutrition, 'id' | 'mealId'>;
	description: string;
	confidence: number;
	warnings?: string[]; // e.g., "Could not identify one item"
	suggestions?: string[]; // e.g., "Consider adding more vegetables"
}

export interface DetectedFood {
	name: string;
	quantity: string; // e.g., "150g", "1 cup"
	calories: number;
	confidence: number;
	source?: 'usda' | 'openfoodfacts' | 'ai_estimate';
}
