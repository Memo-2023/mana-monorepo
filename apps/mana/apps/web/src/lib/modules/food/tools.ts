/**
 * Food Tools — LLM-accessible operations for nutrition tracking.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { mealMutations } from './mutations';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { getDailySummary, toMealWithNutrition } from './queries';
import type { LocalMeal, MealType, LocalGoal } from './types';

export const foodTools: ModuleTool[] = [
	{
		name: 'log_meal',
		module: 'food',
		description: 'Loggt eine Mahlzeit mit optionalen Naehrwerten',
		parameters: [
			{
				name: 'mealType',
				type: 'string',
				description: 'Art der Mahlzeit',
				required: true,
				enum: ['breakfast', 'lunch', 'dinner', 'snack'],
			},
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung der Mahlzeit',
				required: true,
			},
			{ name: 'calories', type: 'number', description: 'Kalorien (kcal)', required: false },
			{ name: 'protein', type: 'number', description: 'Protein (g)', required: false },
		],
		async execute(params) {
			const nutrition =
				params.calories || params.protein
					? {
							calories: (params.calories as number) ?? 0,
							protein: (params.protein as number) ?? 0,
							carbohydrates: 0,
							fat: 0,
							fiber: 0,
							sugar: 0,
						}
					: undefined;

			const meal = await mealMutations.create({
				mealType: params.mealType as MealType,
				description: params.description as string,
				nutrition,
			});
			return {
				success: true,
				data: meal,
				message: `${params.mealType} geloggt: "${params.description}"${nutrition ? ` (${nutrition.calories} kcal)` : ''}`,
			};
		},
	},
	{
		name: 'get_nutrition_summary',
		module: 'food',
		description:
			'Gibt die heutige Ernaehrungs-Zusammenfassung zurueck (Mahlzeiten, Kalorien, Protein)',
		parameters: [],
		async execute() {
			const allMeals = await db.table<LocalMeal>('meals').toArray();
			const active = allMeals.filter((m) => !m.deletedAt);
			const decrypted = await decryptRecords<LocalMeal>('meals', active);
			const meals = decrypted.map(toMealWithNutrition);
			const goals = await db.table<LocalGoal>('goals').toArray();
			const activeGoal = goals.find((g) => !g.deletedAt) ?? null;
			const summary = getDailySummary(meals, new Date(), activeGoal);
			return {
				success: true,
				data: summary,
				message: `${summary.meals.length} Mahlzeiten, ${summary.progress.calories.current}/${summary.progress.calories.target} kcal`,
			};
		},
	},
];
