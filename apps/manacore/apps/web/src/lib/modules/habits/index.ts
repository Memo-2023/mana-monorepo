/**
 * Habits module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { habitsStore } from './stores/habits.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllHabits,
	useAllHabitLogs,
	useHabitLogsForHabit,
	toHabit,
	toHabitLog,
	todayStr,
	getLogsForDate,
	getCountForDate,
	getActiveHabits,
	getTodayCounts,
	getStreak,
	groupLogsByDate,
	formatTime,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { habitTable, habitLogTable, HABITS_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { HABIT_COLORS, HABIT_EMOJIS } from './types';
export type { LocalHabit, LocalHabitLog, Habit, HabitLog } from './types';
