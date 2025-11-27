/**
 * Nutrition Goal Types for Nutriphi Web
 */

export interface NutritionGoal {
	id: string;
	user_id: string;
	calories_target: number;
	protein_target: number;
	carbs_target: number;
	fat_target: number;
	fiber_target?: number;
	sugar_limit?: number;
	created_at: string;
	updated_at: string;
}

export interface DailyProgress {
	date: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	mealsCount: number;
}

export interface GoalProgress {
	goal: NutritionGoal;
	progress: DailyProgress;
	percentages: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
		fiber: number;
	};
}
