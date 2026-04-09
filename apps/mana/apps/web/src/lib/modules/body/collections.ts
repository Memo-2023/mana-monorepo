/**
 * Body module — collection accessors and guest seed data.
 *
 * Tables are defined in the unified database.ts (db.version(2)) as:
 * bodyExercises, bodyRoutines, bodyWorkouts, bodySets,
 * bodyMeasurements, bodyChecks, bodyPhases.
 */

import { db } from '$lib/data/database';
import type {
	LocalBodyExercise,
	LocalBodyRoutine,
	LocalBodyWorkout,
	LocalBodySet,
	LocalBodyMeasurement,
	LocalBodyCheck,
	LocalBodyPhase,
} from './types';

// ─── Collection Accessors ───────────────────────────────────

export const bodyExerciseTable = db.table<LocalBodyExercise>('bodyExercises');
export const bodyRoutineTable = db.table<LocalBodyRoutine>('bodyRoutines');
export const bodyWorkoutTable = db.table<LocalBodyWorkout>('bodyWorkouts');
export const bodySetTable = db.table<LocalBodySet>('bodySets');
export const bodyMeasurementTable = db.table<LocalBodyMeasurement>('bodyMeasurements');
export const bodyCheckTable = db.table<LocalBodyCheck>('bodyChecks');
export const bodyPhaseTable = db.table<LocalBodyPhase>('bodyPhases');

// ─── Guest Seed ─────────────────────────────────────────────

/**
 * Minimal preset exercise library so a fresh guest user can start logging
 * a workout without first having to fill in a name field for every lift.
 * Real users will add and rename freely; presets are flagged isPreset:true
 * so the UI can offer "reset to defaults" without nuking custom entries.
 */
export const BODY_GUEST_SEED = {
	bodyExercises: [
		{
			id: 'body-exercise-squat',
			name: 'Squat',
			muscleGroup: 'quads',
			equipment: 'barbell',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
		{
			id: 'body-exercise-bench',
			name: 'Bench Press',
			muscleGroup: 'chest',
			equipment: 'barbell',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
		{
			id: 'body-exercise-deadlift',
			name: 'Deadlift',
			muscleGroup: 'back',
			equipment: 'barbell',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
		{
			id: 'body-exercise-ohp',
			name: 'Overhead Press',
			muscleGroup: 'shoulders',
			equipment: 'barbell',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
		{
			id: 'body-exercise-row',
			name: 'Barbell Row',
			muscleGroup: 'back',
			equipment: 'barbell',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
		{
			id: 'body-exercise-pullup',
			name: 'Pull-Up',
			muscleGroup: 'back',
			equipment: 'bodyweight',
			notes: null,
			isArchived: false,
			isPreset: true,
		},
	] satisfies LocalBodyExercise[],
	bodyRoutines: [] satisfies LocalBodyRoutine[],
	bodyWorkouts: [] satisfies LocalBodyWorkout[],
	bodySets: [] satisfies LocalBodySet[],
	bodyMeasurements: [] satisfies LocalBodyMeasurement[],
	bodyChecks: [] satisfies LocalBodyCheck[],
	bodyPhases: [] satisfies LocalBodyPhase[],
};
