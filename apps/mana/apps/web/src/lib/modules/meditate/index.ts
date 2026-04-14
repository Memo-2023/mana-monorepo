/**
 * Meditate module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { meditateStore } from './stores/meditate.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllPresets,
	useAllSessions,
	useSettings,
	toMeditatePreset,
	toMeditateSession,
	toMeditateSettings,
	todayDateStr,
	getSessionsForDate,
	getTodaySessions,
	getTodayMinutes,
	getWeekSessionCount,
	getWeekMinutes,
	getCurrentStreak,
	getTotalSessions,
	getTotalMinutes,
	formatDuration,
	formatDurationLong,
	getDefaultSettings,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export {
	meditatePresetTable,
	meditateSessionTable,
	meditateSettingsTable,
	MEDITATE_GUEST_SEED,
} from './collections';

// ─── Types ───────────────────────────────────────────────
export {
	MEDITATE_CATEGORIES,
	CATEGORY_LABELS,
	BELL_SOUND_LABELS,
	BREATH_PHASE_LABELS,
	DEFAULT_SETTINGS,
} from './types';
export type {
	MeditateCategory,
	BellSound,
	BackgroundTheme,
	BreathPattern,
	BreathPhase,
	LocalMeditatePreset,
	LocalMeditateSession,
	LocalMeditateSettings,
	MeditatePreset,
	MeditateSession,
	MeditateSettings,
} from './types';
