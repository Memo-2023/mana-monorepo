/**
 * Guest seed data for the NutriPhi app.
 *
 * Provides demo meals and default goals for the onboarding experience.
 */

import type { LocalMeal, LocalGoal } from './local-store';

const today = new Date().toISOString().split('T')[0];

export const guestMeals: LocalMeal[] = [
	{
		id: 'meal-breakfast',
		date: today,
		mealType: 'breakfast',
		inputType: 'text',
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
		mealType: 'lunch',
		inputType: 'text',
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
];

export const guestGoals: LocalGoal[] = [
	{
		id: 'default-goals',
		dailyCalories: 2000,
		dailyProtein: 60,
		dailyCarbs: 250,
		dailyFat: 65,
		dailyFiber: 30,
	},
];
