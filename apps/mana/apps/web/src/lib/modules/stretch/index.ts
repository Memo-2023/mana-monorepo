/**
 * Stretch module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { stretchStore } from './stores/stretch.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllStretchExercises,
	useAllStretchRoutines,
	useAllStretchSessions,
	useAllStretchAssessments,
	useAllStretchReminders,
	toStretchExercise,
	toStretchRoutine,
	toStretchSession,
	toStretchAssessment,
	toStretchReminder,
	todayDateStr,
	getTodaySessions,
	getTodayMinutes,
	getCurrentStreak,
	getSessionsPerDay,
	getBodyRegionBalance,
	getLatestAssessment,
	getWeakAreas,
	getRecommendedRoutine,
	getActiveExercises,
	getExercisesByRegion,
	getWeekSessionCount,
	relativeDays,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export {
	stretchExerciseTable,
	stretchRoutineTable,
	stretchSessionTable,
	stretchAssessmentTable,
	stretchReminderTable,
	STRETCH_GUEST_SEED,
} from './collections';

// ─── Context ─────────────────────────────────────────────
export {
	stretchExercisesCtx,
	stretchRoutinesCtx,
	stretchSessionsCtx,
	stretchAssessmentsCtx,
	stretchRemindersCtx,
} from './context';

// ─── Types ───────────────────────────────────────────────
export {
	BODY_REGIONS,
	BODY_REGION_LABELS,
	DIFFICULTY_LABELS,
	ROUTINE_TYPE_LABELS,
	ASSESSMENT_TESTS,
} from './types';
export type {
	BodyRegion,
	Difficulty,
	RoutineType,
	RoutineExercise,
	AssessmentTest,
	PainRegion,
	LocalStretchExercise,
	LocalStretchRoutine,
	LocalStretchSession,
	LocalStretchAssessment,
	LocalStretchReminder,
	StretchExercise,
	StretchRoutine,
	StretchSession,
	StretchAssessment,
	StretchReminder,
} from './types';
