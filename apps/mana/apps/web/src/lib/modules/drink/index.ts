/**
 * Drink module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { drinkStore } from './stores/drink.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllDrinkEntries,
	useAllDrinkPresets,
	toDrinkEntry,
	toDrinkPreset,
	todayStr,
	nowTime,
	getEntriesForDate,
	getTotalMlForDate,
	getTotalMlByType,
	groupEntriesByDate,
	getActivePresets,
	formatMl,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { drinkEntryTable, drinkPresetTable, DRINK_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export {
	DRINK_TYPE_LABELS,
	DRINK_TYPE_ICONS,
	DRINK_TYPE_COLORS,
	DEFAULT_DAILY_GOAL_ML,
} from './types';
export type {
	LocalDrinkEntry,
	LocalDrinkPreset,
	DrinkEntry,
	DrinkPreset,
	DrinkType,
} from './types';
