/**
 * Goals Store for Nutriphi Web
 * Manages nutrition goals state using Svelte 5 Runes
 */

import { goalsService } from '$lib/services/goalsService';
import type { NutritionGoal, DailyProgress, GoalProgress } from '$lib/types/goal';

// State
let goals = $state<NutritionGoal | null>(null);
let todayProgress = $state<DailyProgress | null>(null);
let goalProgress = $state<GoalProgress | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived
const hasGoals = $derived(goals !== null);

const caloriePercentage = $derived(
	goals && todayProgress
		? Math.min(Math.round((todayProgress.calories / goals.calories_target) * 100), 100)
		: 0
);

const proteinPercentage = $derived(
	goals && todayProgress
		? Math.min(Math.round((todayProgress.protein / goals.protein_target) * 100), 100)
		: 0
);

const carbsPercentage = $derived(
	goals && todayProgress
		? Math.min(Math.round((todayProgress.carbs / goals.carbs_target) * 100), 100)
		: 0
);

const fatPercentage = $derived(
	goals && todayProgress
		? Math.min(Math.round((todayProgress.fat / goals.fat_target) * 100), 100)
		: 0
);

export const goalsStore = {
	// Getters
	get goals() {
		return goals;
	},
	get todayProgress() {
		return todayProgress;
	},
	get goalProgress() {
		return goalProgress;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get hasGoals() {
		return hasGoals;
	},
	get caloriePercentage() {
		return caloriePercentage;
	},
	get proteinPercentage() {
		return proteinPercentage;
	},
	get carbsPercentage() {
		return carbsPercentage;
	},
	get fatPercentage() {
		return fatPercentage;
	},

	// Actions
	async loadGoals(userId: string) {
		isLoading = true;
		error = null;

		try {
			goals = await goalsService.getGoals(userId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load goals';
			console.error('Failed to load goals:', err);
		} finally {
			isLoading = false;
		}
	},

	async loadDailyProgress(userId: string, date?: string) {
		const targetDate = date || new Date().toISOString().split('T')[0];

		try {
			todayProgress = await goalsService.getDailyProgress(userId, targetDate);
		} catch (err) {
			console.error('Failed to load daily progress:', err);
			todayProgress = null;
		}
	},

	async loadGoalProgress(userId: string, date?: string) {
		const targetDate = date || new Date().toISOString().split('T')[0];

		try {
			goalProgress = await goalsService.getGoalProgress(userId, targetDate);
		} catch (err) {
			console.error('Failed to load goal progress:', err);
			goalProgress = null;
		}
	},

	async saveGoals(userId: string, goalData: Partial<NutritionGoal>) {
		isLoading = true;
		error = null;

		try {
			goals = await goalsService.saveGoals({
				user_id: userId,
				...goalData,
			} as NutritionGoal);
			return goals;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save goals';
			console.error('Failed to save goals:', err);
			throw err;
		} finally {
			isLoading = false;
		}
	},

	clearError() {
		error = null;
	},

	reset() {
		goals = null;
		todayProgress = null;
		goalProgress = null;
		isLoading = false;
		error = null;
	},
};
