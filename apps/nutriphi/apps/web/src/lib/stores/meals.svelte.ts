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
	summaryLoading = $state(false);
	summaryError = $state<string | null>(null);
	deleteError = $state<string | null>(null);

	async fetchTodaysMeals() {
		this.loading = true;
		this.error = null;
		try {
			const today = new Date().toISOString().split('T')[0];
			this.meals = await apiClient.get<MealWithNutrition[]>(`/meals?date=${today}`);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Mahlzeiten konnten nicht geladen werden';
		} finally {
			this.loading = false;
		}
	}

	async fetchDailySummary(date?: Date) {
		this.summaryLoading = true;
		this.summaryError = null;
		try {
			const dateStr = (date || new Date()).toISOString().split('T')[0];
			this.dailySummary = await apiClient.get<DailySummary>(`/stats/daily?date=${dateStr}`);
		} catch (err) {
			this.summaryError =
				err instanceof Error ? err.message : 'Zusammenfassung konnte nicht geladen werden';
		} finally {
			this.summaryLoading = false;
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
		this.error = null;
		try {
			const meal = await apiClient.post<MealWithNutrition>('/meals', mealData);
			this.meals = [...this.meals, meal];
			await this.fetchDailySummary();
			return meal;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Mahlzeit konnte nicht gespeichert werden';
			this.error = message;
			throw new Error(message);
		}
	}

	async deleteMeal(mealId: string) {
		this.deleteError = null;
		try {
			await apiClient.delete(`/meals/${mealId}`);
			this.meals = this.meals.filter((m) => m.id !== mealId);
			await this.fetchDailySummary();
		} catch (err) {
			this.deleteError =
				err instanceof Error ? err.message : 'Mahlzeit konnte nicht gelöscht werden';
			throw new Error(this.deleteError);
		}
	}

	clearErrors() {
		this.error = null;
		this.summaryError = null;
		this.deleteError = null;
	}
}

export const mealsStore = new MealsStore();
