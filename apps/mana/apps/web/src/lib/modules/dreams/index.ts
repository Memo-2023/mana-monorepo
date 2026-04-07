/**
 * Dreams module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { dreamsStore } from './stores/dreams.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllDreams,
	useAllDreamSymbols,
	toDream,
	toDreamSymbol,
	searchDreams,
	groupByMonth,
	formatDreamDate,
	computeInsights,
	getDreamsWithSymbol,
	getMoodDistribution,
	getCooccurringSymbols,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { dreamTable, dreamSymbolTable, dreamTagTable, DREAMS_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { MOOD_COLORS, MOOD_LABELS } from './types';
export type {
	LocalDream,
	LocalDreamSymbol,
	LocalDreamTag,
	Dream,
	DreamSymbol,
	DreamMood,
	DreamClarity,
	SleepQuality,
} from './types';
