// Placeholder - to be implemented
// Will integrate with NutriPhi backend API

export interface NutritionServiceConfig {
	apiUrl: string;
}

export interface Meal {
	id: string;
	userId: string;
	description: string;
	calories: number;
	createdAt: string;
}

export interface NutritionSummary {
	totalCalories: number;
	mealCount: number;
	meals: Meal[];
}

// Export placeholder module
export const NutritionModule = {
	register: () => ({ module: class {}, providers: [], exports: [] }),
};
