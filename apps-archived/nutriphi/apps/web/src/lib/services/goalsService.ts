/**
 * Goals Service for Nutriphi Web
 * Handles nutrition goals API calls
 */

import { env } from '$lib/config/env';
import { tokenManager } from './tokenManager';
import type { NutritionGoal, DailyProgress, GoalProgress } from '$lib/types/goal';

const API_BASE = env.backend.url;

class GoalsService {
	private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const token = await tokenManager.getValidToken();

		const response = await fetch(`${API_BASE}/api${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...options?.headers,
			},
		});

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('Unauthorized');
			}
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || `API error: ${response.status}`);
		}

		return response.json();
	}

	/**
	 * Get user's nutrition goals
	 */
	async getGoals(userId: string): Promise<NutritionGoal | null> {
		try {
			return await this.request<NutritionGoal>(`/goals/${userId}`);
		} catch {
			return null;
		}
	}

	/**
	 * Create or update nutrition goals
	 */
	async saveGoals(goals: Partial<NutritionGoal> & { user_id: string }): Promise<NutritionGoal> {
		return this.request<NutritionGoal>('/goals', {
			method: 'POST',
			body: JSON.stringify(goals),
		});
	}

	/**
	 * Get daily progress
	 */
	async getDailyProgress(userId: string, date: string): Promise<DailyProgress> {
		return this.request<DailyProgress>(`/progress/${userId}?date=${date}`);
	}

	/**
	 * Get goal progress with percentages
	 */
	async getGoalProgress(userId: string, date: string): Promise<GoalProgress | null> {
		try {
			const [goals, progress] = await Promise.all([
				this.getGoals(userId),
				this.getDailyProgress(userId, date),
			]);

			if (!goals) return null;

			const percentages = {
				calories: goals.calories_target ? (progress.calories / goals.calories_target) * 100 : 0,
				protein: goals.protein_target ? (progress.protein / goals.protein_target) * 100 : 0,
				carbs: goals.carbs_target ? (progress.carbs / goals.carbs_target) * 100 : 0,
				fat: goals.fat_target ? (progress.fat / goals.fat_target) * 100 : 0,
				fiber: goals.fiber_target ? (progress.fiber / goals.fiber_target) * 100 : 0,
			};

			return { goal: goals, progress, percentages };
		} catch {
			return null;
		}
	}
}

export const goalsService = new GoalsService();
