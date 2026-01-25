import { apiClient } from '$lib/api/client';
import type { Meal, MealNutrition, DailySummary } from '@nutriphi/shared';

interface MealWithNutrition extends Meal {
	nutrition: MealNutrition | null;
}

class MealsStore {
	meals = $state<MealWithNutrition[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	dailySummary = $state<DailySummary | null>(null);

	async fetchTodaysMeals() {
		this.loading = true;
		this.error = null;
		try {
			const today = new Date().toISOString().split('T')[0];
			this.meals = await apiClient.get<MealWithNutrition[]>(`/meals?date=${today}`);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to fetch meals';
		} finally {
			this.loading = false;
		}
	}

	async fetchDailySummary(date?: Date) {
		try {
			const dateStr = (date || new Date()).toISOString().split('T')[0];
			this.dailySummary = await apiClient.get<DailySummary>(`/stats/daily?date=${dateStr}`);
		} catch (err) {
			console.error('Failed to fetch daily summary:', err);
		}
	}

	async addMeal(mealData: {
		date: string;
		mealType: string;
		inputType: string;
		description: string;
		confidence: number;
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber?: number;
		sugar?: number;
	}) {
		const meal = await apiClient.post<MealWithNutrition>('/meals', mealData);
		this.meals = [...this.meals, meal];
		await this.fetchDailySummary();
		return meal;
	}

	async deleteMeal(mealId: string) {
		await apiClient.delete(`/meals/${mealId}`);
		this.meals = this.meals.filter((m) => m.id !== mealId);
		await this.fetchDailySummary();
	}
}

export const mealsStore = new MealsStore();
