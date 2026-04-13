/**
 * Mood module — barrel exports.
 */

export { moodStore } from './stores/mood.svelte';

export {
	useAllMoodEntries,
	useMoodSettings,
	toMoodEntry,
	toMoodSettings,
	todayDateStr,
	getEntriesForDate,
	getTodayEntries,
	getAvgLevelForDate,
	getAvgLevel,
	getTopEmotion,
	getEmotionDistribution,
	getValenceRatio,
	getActivityInsights,
	getWeekdayPattern,
	getTimeOfDayPattern,
	getWeekMoodData,
	getCurrentStreak,
	getEffectiveSettings,
} from './queries';

export { moodEntryTable, moodSettingsTable, MOOD_GUEST_SEED } from './collections';

export {
	CORE_EMOTIONS,
	EMOTION_META,
	ACTIVITY_LABELS,
	MOOD_TAG_PRESETS,
	DEFAULT_MOOD_SETTINGS,
} from './types';
export type {
	CoreEmotion,
	ActivityContext,
	LocalMoodEntry,
	LocalMoodSettings,
	MoodEntry,
	MoodSettings,
} from './types';
