/**
 * Reactive Queries & Pure Helpers for Recipes module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalRecipe, Recipe, Difficulty } from './types';

// ─── Type Converter ──────────────────────────────────────

export function toRecipe(local: LocalRecipe): Recipe {
	const now = new Date().toISOString();
	return {
		id: local.id,
		title: local.title,
		description: local.description,
		ingredients: local.ingredients ?? [],
		steps: local.steps ?? [],
		servings: local.servings,
		prepTimeMin: local.prepTimeMin ?? null,
		cookTimeMin: local.cookTimeMin ?? null,
		difficulty: local.difficulty,
		tags: local.tags ?? [],
		isFavorite: local.isFavorite,
		photoMediaId: local.photoMediaId ?? null,
		photoUrl: local.photoUrl ?? null,
		photoThumbnailUrl: local.photoThumbnailUrl ?? null,
		visibility: local.visibility ?? 'space',
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllRecipes() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalRecipe, string>('recipes', 'recipes').toArray();
		const visible = locals.filter((r) => !r.deletedAt);
		const decrypted = await decryptRecords('recipes', visible);
		return decrypted.map(toRecipe);
	}, [] as Recipe[]);
}

// ─── Pure Helpers ─────────────────────────────────────────

/** Filter recipes by tag */
export function filterByTag(recipes: Recipe[], tag: string): Recipe[] {
	return recipes.filter((r) => r.tags.includes(tag));
}

/** Filter recipes by difficulty */
export function filterByDifficulty(recipes: Recipe[], difficulty: Difficulty): Recipe[] {
	return recipes.filter((r) => r.difficulty === difficulty);
}

/** Search recipes by title or description */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
	const lower = query.toLowerCase();
	return recipes.filter(
		(r) =>
			r.title.toLowerCase().includes(lower) ||
			r.description.toLowerCase().includes(lower) ||
			r.ingredients.some((i) => i.name.toLowerCase().includes(lower))
	);
}

/** Get all unique tags across all recipes, sorted alphabetically */
export function getAllTags(recipes: Recipe[]): string[] {
	const tags = new Set<string>();
	for (const r of recipes) {
		for (const t of r.tags) tags.add(t);
	}
	return [...tags].sort();
}

/** Get total time (prep + cook) or null if both are null */
export function getTotalTime(recipe: Recipe): number | null {
	if (recipe.prepTimeMin == null && recipe.cookTimeMin == null) return null;
	return (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);
}

/** Format minutes as human-readable string */
export function formatTime(minutes: number): string {
	if (minutes < 60) return `${minutes} Min.`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
}
