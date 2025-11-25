/**
 * Meals Store for Nutriphi Web
 * Manages meal state using Svelte 5 Runes
 */

import { mealService } from '$lib/services/mealService';
import type { Meal, MealWithItems, DailySummary, MealFilters } from '$lib/types/meal';

// State
let meals = $state<Meal[]>([]);
let selectedMeal = $state<MealWithItems | null>(null);
let dailySummary = $state<DailySummary | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived
const sortedMeals = $derived(
  [...meals].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
);

const todaysMeals = $derived(
  meals.filter((meal) => {
    const today = new Date().toISOString().split('T')[0];
    return meal.timestamp.startsWith(today);
  })
);

const totalCaloriesToday = $derived(
  todaysMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0)
);

export const mealsStore = {
  // Getters
  get meals() {
    return meals;
  },
  get sortedMeals() {
    return sortedMeals;
  },
  get todaysMeals() {
    return todaysMeals;
  },
  get selectedMeal() {
    return selectedMeal;
  },
  get dailySummary() {
    return dailySummary;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },
  get totalCaloriesToday() {
    return totalCaloriesToday;
  },

  // Actions
  async loadMeals(userId: string, filters?: MealFilters) {
    isLoading = true;
    error = null;

    try {
      meals = await mealService.getMeals(userId, filters);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load meals';
      console.error('Failed to load meals:', err);
    } finally {
      isLoading = false;
    }
  },

  async loadMealById(id: string) {
    isLoading = true;
    error = null;

    try {
      selectedMeal = await mealService.getMealById(id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load meal';
      console.error('Failed to load meal:', err);
      selectedMeal = null;
    } finally {
      isLoading = false;
    }
  },

  async loadDailySummary(userId: string, date: string) {
    try {
      dailySummary = await mealService.getDailySummary(userId, date);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
      dailySummary = null;
    }
  },

  async createMeal(meal: Partial<Meal> & { user_id: string }) {
    isLoading = true;
    error = null;

    try {
      const newMeal = await mealService.createMeal(meal);
      meals = [newMeal, ...meals];
      return newMeal;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create meal';
      console.error('Failed to create meal:', err);
      throw err;
    } finally {
      isLoading = false;
    }
  },

  async updateMeal(id: string, updates: Partial<Meal>) {
    isLoading = true;
    error = null;

    try {
      const updatedMeal = await mealService.updateMeal(id, updates);
      meals = meals.map((m) => (m.id === id ? updatedMeal : m));
      if (selectedMeal?.id === id) {
        selectedMeal = { ...selectedMeal, ...updatedMeal };
      }
      return updatedMeal;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update meal';
      console.error('Failed to update meal:', err);
      throw err;
    } finally {
      isLoading = false;
    }
  },

  async deleteMeal(id: string) {
    isLoading = true;
    error = null;

    try {
      await mealService.deleteMeal(id);
      meals = meals.filter((m) => m.id !== id);
      if (selectedMeal?.id === id) {
        selectedMeal = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete meal';
      console.error('Failed to delete meal:', err);
      throw err;
    } finally {
      isLoading = false;
    }
  },

  clearSelectedMeal() {
    selectedMeal = null;
  },

  clearError() {
    error = null;
  },

  reset() {
    meals = [];
    selectedMeal = null;
    dailySummary = null;
    isLoading = false;
    error = null;
  }
};
