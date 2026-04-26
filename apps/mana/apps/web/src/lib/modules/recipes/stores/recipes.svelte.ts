/**
 * Recipes Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
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
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
		};
		const snapshot = toRecipe({ ...newLocal });
		await encryptRecord('recipes', newLocal);
		await recipeTable.add(newLocal);
		emitDomainEvent('RecipeCreated', 'recipes', 'recipes', newLocal.id, {
			recipeId: newLocal.id,
			title: input.title ?? '',
		});
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
		await recipeTable.update(id, wrapped);
	},

	async deleteRecipe(id: string) {
		await recipeTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		emitDomainEvent('RecipeDeleted', 'recipes', 'recipes', id, { recipeId: id });
	},

	async toggleFavorite(id: string) {
		const existing = await recipeTable.get(id);
		if (!existing) return;
		await recipeTable.update(id, {
			isFavorite: !existing.isFavorite,
		});
	},

	/**
	 * Flip the recipe's visibility. Typical use-case: mark tested
	 * recipes 'public' so they land in the recipes.recipes embed on
	 * the owner's website.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await recipeTable.get(id);
		if (!existing) throw new Error(`Recipe ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalRecipe> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await recipeTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', 'recipes', 'recipes', id, {
			recordId: id,
			collection: 'recipes',
			before,
			after: next,
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
			// Duplicate resets to the space default; copies should not
			// inherit a public flag from the original (same rule as picture
			// boards — makes sharing explicit, not transitive).
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
			visibilityChangedAt: undefined,
			visibilityChangedBy: undefined,
			unlistedToken: undefined,
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
