/**
 * Recipes Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { encryptRecord } from '$lib/data/crypto';
import { recipeTable } from '../collections';
import { toRecipe } from '../queries';
import type { LocalRecipe, Difficulty, Ingredient } from '../types';

export const recipesStore = {
	async createRecipe(input: {
		title: string;
		description?: string;
		ingredients?: Ingredient[];
		steps?: string[];
		servings?: number;
		prepTimeMin?: number | null;
		cookTimeMin?: number | null;
		difficulty?: Difficulty;
		tags?: string[];
	}) {
		const newLocal: LocalRecipe = {
			id: crypto.randomUUID(),
			title: input.title,
			description: input.description ?? '',
			ingredients: input.ingredients ?? [],
			steps: input.steps ?? [],
			servings: input.servings ?? 4,
			prepTimeMin: input.prepTimeMin ?? null,
			cookTimeMin: input.cookTimeMin ?? null,
			difficulty: input.difficulty ?? 'medium',
			tags: input.tags ?? [],
			isFavorite: false,
			photoMediaId: null,
			photoUrl: null,
			photoThumbnailUrl: null,
		};
		const snapshot = toRecipe({ ...newLocal });
		await encryptRecord('recipes', newLocal);
		await recipeTable.add(newLocal);
		return snapshot;
	},

	async updateRecipe(
		id: string,
		patch: Partial<
			Pick<
				LocalRecipe,
				| 'title'
				| 'description'
				| 'ingredients'
				| 'steps'
				| 'servings'
				| 'prepTimeMin'
				| 'cookTimeMin'
				| 'difficulty'
				| 'tags'
				| 'photoMediaId'
				| 'photoUrl'
				| 'photoThumbnailUrl'
			>
		>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('recipes', wrapped);
		await recipeTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteRecipe(id: string) {
		await recipeTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string) {
		const existing = await recipeTable.get(id);
		if (!existing) return;
		await recipeTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async duplicateRecipe(id: string) {
		const existing = await recipeTable.get(id);
		if (!existing) return null;

		const newLocal: LocalRecipe = {
			...existing,
			id: crypto.randomUUID(),
			title: `Kopie von ${existing.title}`,
			isFavorite: false,
			createdAt: undefined,
			updatedAt: undefined,
			deletedAt: undefined,
		};
		const snapshot = toRecipe({ ...newLocal });
		// existing record is already encrypted — re-encrypt the clone
		await encryptRecord('recipes', newLocal);
		await recipeTable.add(newLocal);
		return snapshot;
	},
};
