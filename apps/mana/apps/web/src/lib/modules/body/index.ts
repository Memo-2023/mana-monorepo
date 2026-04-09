/**
 * Body module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { bodyStore } from './stores/body.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllBodyExercises,
	useAllBodyRoutines,
	useAllBodyWorkouts,
	useAllBodySets,
	useSetsForWorkout,
	useAllBodyMeasurements,
	useAllBodyChecks,
	useAllBodyPhases,
	toBodyExercise,
	toBodyRoutine,
	toBodyWorkout,
	toBodySet,
	toBodyMeasurement,
	toBodyCheck,
	toBodyPhase,
	todayDateStr,
	getLatestWeight,
	getWorkoutVolume,
	getBestSetByExercise,
	estimateOneRepMax,
	getActiveExercises,
	getActiveWorkout,
	getActivePhase,
	getLastSetByExercise,
	getE1rmTimeline,
	relativeDays,
} from './queries';
export type { E1rmPoint } from './queries';

// ─── Collections ─────────────────────────────────────────
export {
	bodyExerciseTable,
	bodyRoutineTable,
	bodyWorkoutTable,
	bodySetTable,
	bodyMeasurementTable,
	bodyCheckTable,
	bodyPhaseTable,
	BODY_GUEST_SEED,
} from './collections';

// ─── Types ───────────────────────────────────────────────
export { MUSCLE_GROUPS, EQUIPMENT_TYPES, MEASUREMENT_TYPES } from './types';
export type {
	MuscleGroup,
	Equipment,
	MeasurementType,
	WeightUnit,
	LengthUnit,
	PhaseKind,
	LocalBodyExercise,
	LocalBodyRoutine,
	LocalBodyWorkout,
	LocalBodySet,
	LocalBodyMeasurement,
	LocalBodyCheck,
	LocalBodyPhase,
	BodyExercise,
	BodyRoutine,
	BodyWorkout,
	BodySet,
	BodyMeasurement,
	BodyCheck,
	BodyPhase,
} from './types';
