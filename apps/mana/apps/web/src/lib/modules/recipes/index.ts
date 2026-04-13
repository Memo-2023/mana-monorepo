/**
 * Recipes module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { recipesStore } from './stores/recipes.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllRecipes,
	toRecipe,
	filterByTag,
	filterByDifficulty,
	searchRecipes,
	getAllTags,
	getTotalTime,
	formatTime,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { recipeTable, RECIPES_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { DIFFICULTY_LABELS, DIFFICULTY_COLORS, DEFAULT_TAGS, UNIT_OPTIONS } from './types';
export type { LocalRecipe, Recipe, Ingredient, Difficulty } from './types';
