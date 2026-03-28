/**
 * Meals Store — Write Actions Only
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store only exposes mutation actions that write to IndexedDB.
 */

import { mealCollection, type LocalMeal } from '$lib/data/local-store';
import { NutriPhiEvents } from '@manacore/shared-utils/analytics';

// ─── Actions ─────────────────────────────────────────────────

async function addMeal(mealData: {
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
	NutriPhiEvents.mealAdded(mealData.mealType, mealData.inputType);
	return inserted;
}

async function deleteMeal(mealId: string) {
	await mealCollection.delete(mealId);
	NutriPhiEvents.mealDeleted();
}

export const mealsStore = {
	addMeal,
	deleteMeal,
};
