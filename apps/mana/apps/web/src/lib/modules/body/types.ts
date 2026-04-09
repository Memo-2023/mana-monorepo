/**
 * Body module types — combined fitness training + body composition tracking.
 *
 * The module merges what would otherwise be two separate apps ("fitness" and
 * "bodylog") because the value lives in their intersection: tracking lifts
 * alongside bodyweight is what enables real progressive-overload + recomp
 * insights. See docs/future/MODULE_IDEAS.md for the rationale.
 *
 * Tables:
 *   bodyExercises    — exercise library (Squat, Bench, Curl …)
 *   bodyRoutines     — saved workout templates (PPL day, Upper, …)
 *   bodyWorkouts     — one logged training session
 *   bodySets         — individual set rows inside a workout
 *   bodyMeasurements — weight + body measurements over time
 *   bodyChecks       — daily mini check-in (energy / sleep / soreness)
 *   bodyPhases       — cut / bulk / maintenance phase markers
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Enums / unions ─────────────────────────────────────────

export type MuscleGroup =
	| 'chest'
	| 'back'
	| 'shoulders'
	| 'biceps'
	| 'triceps'
	| 'forearms'
	| 'core'
	| 'quads'
	| 'hamstrings'
	| 'glutes'
	| 'calves'
	| 'cardio'
	| 'fullbody';

export type Equipment =
	| 'barbell'
	| 'dumbbell'
	| 'machine'
	| 'cable'
	| 'bodyweight'
	| 'kettlebell'
	| 'band'
	| 'other';

export type MeasurementType =
	| 'weight'
	| 'bodyfat'
	| 'muscle'
	| 'chest'
	| 'waist'
	| 'hips'
	| 'thigh'
	| 'arm'
	| 'calf'
	| 'neck';

export type WeightUnit = 'kg' | 'lbs';
export type LengthUnit = 'cm' | 'in';

export type PhaseKind = 'cut' | 'bulk' | 'maintenance' | 'recomp';

// ─── Local Record Types (Dexie) ─────────────────────────────

export interface LocalBodyExercise extends BaseRecord {
	name: string;
	muscleGroup: MuscleGroup;
	equipment: Equipment;
	notes: string | null;
	isArchived: boolean;
	/** Built-in preset (vs. user-created). Presets are not deleteable. */
	isPreset: boolean;
}

export interface LocalBodyRoutine extends BaseRecord {
	name: string;
	description: string | null;
	/** Ordered list of exerciseIds in this routine. */
	exerciseIds: string[];
	order: number;
	isArchived: boolean;
}

export interface LocalBodyWorkout extends BaseRecord {
	/** ISO date+time the session started. */
	startedAt: string;
	/** ISO date+time the session ended (null = still ongoing). */
	endedAt: string | null;
	routineId: string | null;
	title: string | null;
	notes: string | null;
	/** 1–10 perceived effort for the whole session. */
	rpe: number | null;
}

export interface LocalBodySet extends BaseRecord {
	workoutId: string;
	exerciseId: string;
	/** Sort order within the workout. */
	order: number;
	reps: number;
	weight: number;
	weightUnit: WeightUnit;
	/** 1–10 reps in reserve / RPE for this single set. */
	rpe: number | null;
	isWarmup: boolean;
	notes: string | null;
}

export interface LocalBodyMeasurement extends BaseRecord {
	/** YYYY-MM-DD */
	date: string;
	type: MeasurementType;
	value: number;
	unit: WeightUnit | LengthUnit | 'percent';
	notes: string | null;
}

export interface LocalBodyCheck extends BaseRecord {
	/** YYYY-MM-DD — one row per day. */
	date: string;
	/** 1–5 scale for each. */
	energy: number | null;
	sleep: number | null;
	soreness: number | null;
	mood: number | null;
	notes: string | null;
}

export interface LocalBodyPhase extends BaseRecord {
	kind: PhaseKind;
	startDate: string;
	endDate: string | null;
	startWeight: number | null;
	targetWeight: number | null;
	notes: string | null;
}

// ─── Domain Types (UI-facing) ───────────────────────────────

export interface BodyExercise {
	id: string;
	name: string;
	muscleGroup: MuscleGroup;
	equipment: Equipment;
	notes: string | null;
	isArchived: boolean;
	isPreset: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface BodyRoutine {
	id: string;
	name: string;
	description: string | null;
	exerciseIds: string[];
	order: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface BodyWorkout {
	id: string;
	startedAt: string;
	endedAt: string | null;
	routineId: string | null;
	title: string | null;
	notes: string | null;
	rpe: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface BodySet {
	id: string;
	workoutId: string;
	exerciseId: string;
	order: number;
	reps: number;
	weight: number;
	weightUnit: WeightUnit;
	rpe: number | null;
	isWarmup: boolean;
	notes: string | null;
	createdAt: string;
}

export interface BodyMeasurement {
	id: string;
	date: string;
	type: MeasurementType;
	value: number;
	unit: WeightUnit | LengthUnit | 'percent';
	notes: string | null;
	createdAt: string;
}

export interface BodyCheck {
	id: string;
	date: string;
	energy: number | null;
	sleep: number | null;
	soreness: number | null;
	mood: number | null;
	notes: string | null;
	createdAt: string;
}

export interface BodyPhase {
	id: string;
	kind: PhaseKind;
	startDate: string;
	endDate: string | null;
	startWeight: number | null;
	targetWeight: number | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ──────────────────────────────────────────────

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
	'chest',
	'back',
	'shoulders',
	'biceps',
	'triceps',
	'forearms',
	'core',
	'quads',
	'hamstrings',
	'glutes',
	'calves',
	'cardio',
	'fullbody',
] as const;

export const EQUIPMENT_TYPES: readonly Equipment[] = [
	'barbell',
	'dumbbell',
	'machine',
	'cable',
	'bodyweight',
	'kettlebell',
	'band',
	'other',
] as const;

export const MEASUREMENT_TYPES: readonly MeasurementType[] = [
	'weight',
	'bodyfat',
	'muscle',
	'chest',
	'waist',
	'hips',
	'thigh',
	'arm',
	'calf',
	'neck',
] as const;
