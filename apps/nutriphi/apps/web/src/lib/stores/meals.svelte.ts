/**
 * Meals Store — Local-First with @manacore/local-store
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 */

import { mealCollection, type LocalMeal } from '$lib/data/local-store';
import type { Meal, MealNutrition, DailySummary } from '@nutriphi/shared';
import { NutriPhiEvents } from '@manacore/shared-utils/analytics';

interface MealWithNutrition extends Meal {
	nutrition: MealNutrition | null;
}

function toMealWithNutrition(local: LocalMeal): MealWithNutrition {
	return {
		id: local.id,
		userId: 'local',
		date: new Date(local.date),
		mealType: local.mealType as any,
		inputType: local.inputType as any,
		description: local.description,
		portionSize: local.portionSize ?? undefined,
		confidence: local.confidence,
		createdAt: new Date(local.createdAt ?? Date.now()),
		nutrition: local.nutrition
			? {
					id: local.id,
					mealId: local.id,
					calories: local.nutrition.calories,
					protein: local.nutrition.protein,
					carbohydrates: local.nutrition.carbohydrates,
					fat: local.nutrition.fat,
					fiber: local.nutrition.fiber,
					sugar: local.nutrition.sugar,
				}
			: null,
	} as MealWithNutrition;
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
			const allMeals = await mealCollection.getAll();
			this.meals = allMeals
				.filter((m) => m.date === today)
				.map(toMealWithNutrition)
				.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
			const allMeals = await mealCollection.getAll();
			const dayMeals = allMeals.filter((m) => m.date === dateStr);

			const totalNutrition = dayMeals.reduce(
				(acc, m) => ({
					calories: acc.calories + (m.nutrition?.calories || 0),
					protein: acc.protein + (m.nutrition?.protein || 0),
					carbohydrates: acc.carbohydrates + (m.nutrition?.carbohydrates || 0),
					fat: acc.fat + (m.nutrition?.fat || 0),
					fiber: acc.fiber + (m.nutrition?.fiber || 0),
					sugar: acc.sugar + (m.nutrition?.sugar || 0),
				}),
				{ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
			);

			this.dailySummary = {
				date: new Date(dateStr),
				meals: dayMeals.map(toMealWithNutrition),
				totalNutrition,
			} as DailySummary;
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
			const newMeal: LocalMeal = {
				id: crypto.randomUUID(),
				date: mealData.date,
				mealType: mealData.mealType as any,
				inputType: mealData.inputType as any,
				description: mealData.description,
				confidence: mealData.confidence,
				nutrition: {
					calories: mealData.calories,
					protein: mealData.protein,
					carbohydrates: mealData.carbohydrates,
					fat: mealData.fat,
					fiber: mealData.fiber || 0,
					sugar: mealData.sugar || 0,
				},
			};

			const inserted = await mealCollection.insert(newMeal);
			const meal = toMealWithNutrition(inserted);
			this.meals = [...this.meals, meal];
			await this.fetchDailySummary();
			NutriPhiEvents.mealAdded(mealData.mealType, mealData.inputType);
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
			await mealCollection.delete(mealId);
			this.meals = this.meals.filter((m) => m.id !== mealId);
			await this.fetchDailySummary();
			NutriPhiEvents.mealDeleted();
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
