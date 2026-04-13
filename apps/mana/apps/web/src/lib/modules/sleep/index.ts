/**
 * Sleep module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { sleepStore } from './stores/sleep.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllSleepEntries,
	useAllSleepHygieneLogs,
	useAllSleepHygieneChecks,
	useSleepSettings,
	toSleepEntry,
	toSleepHygieneLog,
	toSleepHygieneCheck,
	toSleepSettings,
	todayDateStr,
	yesterdayDateStr,
	calcDurationMin,
	formatDuration,
	formatTime,
	getLastNight,
	getEntryForDate,
	hasLoggedToday,
	getAvgDuration,
	getAvgQuality,
	getWeekSleepDebt,
	getConsistencyScore,
	getCurrentStreak,
	getWeekData,
	getQualityHeatmap,
	getHygieneCorrelation,
	getEffectiveSettings,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export {
	sleepEntryTable,
	sleepHygieneLogTable,
	sleepHygieneCheckTable,
	sleepSettingsTable,
	SLEEP_GUEST_SEED,
} from './collections';

// ─── Types ───────────────────────────────────────────────
export {
	HYGIENE_CATEGORIES,
	HYGIENE_CATEGORY_LABELS,
	QUALITY_LABELS,
	SLEEP_TAG_PRESETS,
	DEFAULT_SLEEP_SETTINGS,
} from './types';
export type {
	HygieneCategory,
	LocalSleepEntry,
	LocalSleepHygieneLog,
	LocalSleepHygieneCheck,
	LocalSleepSettings,
	SleepEntry,
	SleepHygieneLog,
	SleepHygieneCheck,
	SleepSettings,
} from './types';
