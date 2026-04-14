/**
 * Food module — collection accessors and guest seed data.
 *
 * Uses table names in the unified DB: meals, goals, foodFavorites.
 */

import { db } from '$lib/data/database';
import type { LocalMeal, LocalGoal, LocalFavorite } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const mealTable = db.table<LocalMeal>('meals');
export const goalTable = db.table<LocalGoal>('goals');
export const foodFavoriteTable = db.table<LocalFavorite>('foodFavorites');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

export const FOOD_GUEST_SEED = {
	meals: [
		{
			id: 'meal-breakfast',
			date: today,
			mealType: 'breakfast' as const,
			inputType: 'text' as const,
			description: 'Haferflocken mit Banane und Honig',
			confidence: 0.9,
			nutrition: {
				calories: 380,
				protein: 10,
				carbohydrates: 68,
				fat: 8,
				fiber: 6,
				sugar: 24,
			},
		},
		{
			id: 'meal-lunch',
			date: today,
			mealType: 'lunch' as const,
			inputType: 'text' as const,
			description: 'Vollkorn-Sandwich mit Avocado und Ei',
			confidence: 0.85,
			nutrition: {
				calories: 520,
				protein: 22,
				carbohydrates: 45,
				fat: 28,
				fiber: 8,
				sugar: 4,
			},
		},
	],
	goals: [
		{
			id: 'default-goals',
			dailyCalories: 2000,
			dailyProtein: 60,
			dailyCarbs: 250,
			dailyFat: 65,
			dailyFiber: 30,
		},
	],
};
