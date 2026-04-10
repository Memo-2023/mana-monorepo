/**
 * Body Store — mutation-only service for the combined fitness/bodylog module.
 *
 * All reads happen via liveQuery hooks in queries.ts. This file only writes:
 * exercise CRUD, routine CRUD, workout/set logging, daily checks, weight +
 * measurement entries, and cut/bulk/maintenance phase tracking.
 *
 * Encryption: every user-typed text field (notes, names, descriptions) is
 * passed through encryptRecord() before hitting Dexie. The crypto registry
 * in $lib/data/crypto/registry.ts is the source of truth for which fields
 * actually get wrapped — this store just calls encryptRecord and trusts the
 * registry to do the right thing per table.
 */

import { encryptRecord } from '$lib/data/crypto';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import {
	bodyExerciseTable,
	bodyRoutineTable,
	bodyWorkoutTable,
	bodySetTable,
	bodyMeasurementTable,
	bodyCheckTable,
	bodyPhaseTable,
} from '../collections';
import {
	toBodyExercise,
	toBodyRoutine,
	toBodyWorkout,
	toBodySet,
	toBodyMeasurement,
	toBodyCheck,
	toBodyPhase,
} from '../queries';
import type {
	LocalBodyExercise,
	LocalBodyRoutine,
	LocalBodyWorkout,
	LocalBodySet,
	LocalBodyMeasurement,
	LocalBodyCheck,
	LocalBodyPhase,
	MuscleGroup,
	Equipment,
	MeasurementType,
	WeightUnit,
	LengthUnit,
	PhaseKind,
} from '../types';

export const bodyStore = {
	// ─── Exercises ──────────────────────────────────────────

	async createExercise(input: {
		name: string;
		muscleGroup: MuscleGroup;
		equipment: Equipment;
		notes?: string | null;
	}) {
		const newLocal: LocalBodyExercise = {
			id: crypto.randomUUID(),
			name: input.name,
			muscleGroup: input.muscleGroup,
			equipment: input.equipment,
			notes: input.notes ?? null,
			isArchived: false,
			isPreset: false,
		};
		const snapshot = toBodyExercise({ ...newLocal });
		await encryptRecord('bodyExercises', newLocal);
		await bodyExerciseTable.add(newLocal);
		return snapshot;
	},

	async updateExercise(
		id: string,
		patch: Partial<
			Pick<LocalBodyExercise, 'name' | 'muscleGroup' | 'equipment' | 'notes' | 'isArchived'>
		>
	) {
		const wrapped = await encryptRecord('bodyExercises', { ...patch });
		await bodyExerciseTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteExercise(id: string) {
		// Presets are kept around as a recovery option — soft-delete only
		// when the user explicitly nukes a custom exercise. The UI should
		// already gate the delete button on isPreset === false; this is
		// the belt-and-suspenders check.
		const exercise = await bodyExerciseTable.get(id);
		if (!exercise || exercise.isPreset) return;
		await bodyExerciseTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	// ─── Routines ───────────────────────────────────────────

	async createRoutine(input: { name: string; description?: string | null; exerciseIds: string[] }) {
		const existing = await bodyRoutineTable.toArray();
		const order = existing.filter((r) => !r.deletedAt).length;

		const newLocal: LocalBodyRoutine = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? null,
			exerciseIds: input.exerciseIds,
			order,
			isArchived: false,
		};
		const snapshot = toBodyRoutine({ ...newLocal });
		await encryptRecord('bodyRoutines', newLocal);
		await bodyRoutineTable.add(newLocal);
		return snapshot;
	},

	async updateRoutine(
		id: string,
		patch: Partial<
			Pick<LocalBodyRoutine, 'name' | 'description' | 'exerciseIds' | 'order' | 'isArchived'>
		>
	) {
		const wrapped = await encryptRecord('bodyRoutines', { ...patch });
		await bodyRoutineTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteRoutine(id: string) {
		await bodyRoutineTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	// ─── Workouts ───────────────────────────────────────────

	/**
	 * Start a new training session. Leaves endedAt null so the rest of the
	 * UI can find "the active workout" with a single .where('endedAt').
	 * If a workout is already running we return it instead of starting a
	 * second one — the user almost certainly forgot to finish the last one
	 * and silently double-tracking would corrupt their volume math.
	 */
	async startWorkout(input: { routineId?: string | null; title?: string | null }) {
		const existing = await bodyWorkoutTable.toArray();
		const active = existing.find((w) => !w.deletedAt && w.endedAt === null);
		if (active) return toBodyWorkout(active);

		const workoutId = crypto.randomUUID();
		const now = new Date().toISOString();
		const title = input.title ?? 'Workout';

		// Create a TimeBlock so the workout appears in calendar + timeline.
		// endDate is null (ongoing) — finishWorkout stamps it later.
		const timeBlockId = await createBlock({
			startDate: now,
			endDate: null,
			kind: 'logged',
			type: 'body',
			sourceModule: 'body',
			sourceId: workoutId,
			title,
			color: '#ef4444',
			icon: null,
		});

		const newLocal: LocalBodyWorkout = {
			id: workoutId,
			startedAt: now,
			endedAt: null,
			routineId: input.routineId ?? null,
			title,
			notes: null,
			rpe: null,
			timeBlockId,
		};
		const snapshot = toBodyWorkout({ ...newLocal });
		await encryptRecord('bodyWorkouts', newLocal);
		await bodyWorkoutTable.add(newLocal);
		return snapshot;
	},

	async finishWorkout(id: string, patch?: { notes?: string | null; rpe?: number | null }) {
		const now = new Date().toISOString();
		const update: Partial<LocalBodyWorkout> = {
			endedAt: now,
			notes: patch?.notes ?? null,
			rpe: patch?.rpe ?? null,
		};
		const wrapped = await encryptRecord('bodyWorkouts', { ...update });
		await bodyWorkoutTable.update(id, {
			...wrapped,
			updatedAt: now,
		});

		// Stamp the TimeBlock's endDate so the calendar shows duration.
		const workout = await bodyWorkoutTable.get(id);
		if (workout?.timeBlockId) {
			await updateBlock(workout.timeBlockId, { endDate: now });
		}
	},

	async updateWorkout(
		id: string,
		patch: Partial<Pick<LocalBodyWorkout, 'title' | 'notes' | 'rpe' | 'startedAt' | 'endedAt'>>
	) {
		const wrapped = await encryptRecord('bodyWorkouts', { ...patch });
		await bodyWorkoutTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteWorkout(id: string) {
		// Soft-delete the workout AND its sets so the volume aggregates
		// stop counting them. Also remove the linked TimeBlock.
		const workout = await bodyWorkoutTable.get(id);
		const now = new Date().toISOString();
		await bodyWorkoutTable.update(id, { deletedAt: now, updatedAt: now });
		const sets = await bodySetTable.where('workoutId').equals(id).toArray();
		for (const s of sets) {
			await bodySetTable.update(s.id, { deletedAt: now });
		}
		if (workout?.timeBlockId) {
			await deleteBlock(workout.timeBlockId);
		}
	},

	// ─── Sets ───────────────────────────────────────────────

	async logSet(input: {
		workoutId: string;
		exerciseId: string;
		reps: number;
		weight: number;
		weightUnit: WeightUnit;
		rpe?: number | null;
		isWarmup?: boolean;
		notes?: string | null;
	}) {
		const existing = await bodySetTable.where('workoutId').equals(input.workoutId).toArray();
		const order = existing.filter((s) => !s.deletedAt).length;

		const newLocal: LocalBodySet = {
			id: crypto.randomUUID(),
			workoutId: input.workoutId,
			exerciseId: input.exerciseId,
			order,
			reps: input.reps,
			weight: input.weight,
			weightUnit: input.weightUnit,
			rpe: input.rpe ?? null,
			isWarmup: input.isWarmup ?? false,
			notes: input.notes ?? null,
		};
		const snapshot = toBodySet({ ...newLocal });
		await encryptRecord('bodySets', newLocal);
		await bodySetTable.add(newLocal);
		return snapshot;
	},

	async updateSet(
		id: string,
		patch: Partial<
			Pick<LocalBodySet, 'reps' | 'weight' | 'weightUnit' | 'rpe' | 'isWarmup' | 'notes'>
		>
	) {
		const wrapped = await encryptRecord('bodySets', { ...patch });
		await bodySetTable.update(id, wrapped);
	},

	async deleteSet(id: string) {
		await bodySetTable.update(id, { deletedAt: new Date().toISOString() });
	},

	// ─── Measurements (weight + body comp) ─────────────────

	async logMeasurement(input: {
		date?: string;
		type: MeasurementType;
		value: number;
		unit: WeightUnit | LengthUnit | 'percent';
		notes?: string | null;
	}) {
		const newLocal: LocalBodyMeasurement = {
			id: crypto.randomUUID(),
			date: input.date ?? new Date().toISOString().split('T')[0],
			type: input.type,
			value: input.value,
			unit: input.unit,
			notes: input.notes ?? null,
		};
		const snapshot = toBodyMeasurement({ ...newLocal });
		await encryptRecord('bodyMeasurements', newLocal);
		await bodyMeasurementTable.add(newLocal);
		return snapshot;
	},

	async updateMeasurement(
		id: string,
		patch: Partial<Pick<LocalBodyMeasurement, 'value' | 'unit' | 'notes' | 'date'>>
	) {
		const wrapped = await encryptRecord('bodyMeasurements', { ...patch });
		await bodyMeasurementTable.update(id, wrapped);
	},

	async deleteMeasurement(id: string) {
		await bodyMeasurementTable.update(id, { deletedAt: new Date().toISOString() });
	},

	// ─── Daily Checks ──────────────────────────────────────

	/**
	 * Upsert the check-in row for `date`. We treat (userId, date) as the
	 * logical key — the Dexie schema only indexes by id, so we look up
	 * locally and update in place if a row already exists for the day.
	 * This keeps the UI's "rate today's energy" toggle idempotent.
	 */
	async upsertCheck(input: {
		date?: string;
		energy?: number | null;
		sleep?: number | null;
		soreness?: number | null;
		mood?: number | null;
		notes?: string | null;
	}) {
		const date = input.date ?? new Date().toISOString().split('T')[0];
		const existing = (await bodyCheckTable.toArray()).find((c) => !c.deletedAt && c.date === date);

		if (existing) {
			const patch: Partial<LocalBodyCheck> = {
				energy: input.energy ?? existing.energy,
				sleep: input.sleep ?? existing.sleep,
				soreness: input.soreness ?? existing.soreness,
				mood: input.mood ?? existing.mood,
				notes: input.notes ?? existing.notes,
			};
			const wrapped = await encryptRecord('bodyChecks', { ...patch });
			await bodyCheckTable.update(existing.id, {
				...wrapped,
				updatedAt: new Date().toISOString(),
			});
			return toBodyCheck({ ...existing, ...patch });
		}

		const newLocal: LocalBodyCheck = {
			id: crypto.randomUUID(),
			date,
			energy: input.energy ?? null,
			sleep: input.sleep ?? null,
			soreness: input.soreness ?? null,
			mood: input.mood ?? null,
			notes: input.notes ?? null,
		};
		const snapshot = toBodyCheck({ ...newLocal });
		await encryptRecord('bodyChecks', newLocal);
		await bodyCheckTable.add(newLocal);
		return snapshot;
	},

	async deleteCheck(id: string) {
		await bodyCheckTable.update(id, { deletedAt: new Date().toISOString() });
	},

	// ─── Phases (cut / bulk / maintenance) ─────────────────

	async startPhase(input: {
		kind: PhaseKind;
		startWeight?: number | null;
		targetWeight?: number | null;
		notes?: string | null;
	}) {
		// Close any existing open phase before opening a new one — the
		// "active phase" view assumes at most one row with endDate = null,
		// and a stale open row would otherwise haunt every recommendation.
		const existing = await bodyPhaseTable.toArray();
		const openPhase = existing.find((p) => !p.deletedAt && p.endDate === null);
		if (openPhase) {
			await this.endPhase(openPhase.id);
		}

		const newLocal: LocalBodyPhase = {
			id: crypto.randomUUID(),
			kind: input.kind,
			startDate: new Date().toISOString().split('T')[0],
			endDate: null,
			startWeight: input.startWeight ?? null,
			targetWeight: input.targetWeight ?? null,
			notes: input.notes ?? null,
		};
		const snapshot = toBodyPhase({ ...newLocal });
		await encryptRecord('bodyPhases', newLocal);
		await bodyPhaseTable.add(newLocal);
		return snapshot;
	},

	async endPhase(id: string) {
		await bodyPhaseTable.update(id, {
			endDate: new Date().toISOString().split('T')[0],
			updatedAt: new Date().toISOString(),
		});
	},

	async updatePhase(
		id: string,
		patch: Partial<
			Pick<
				LocalBodyPhase,
				'kind' | 'startDate' | 'endDate' | 'startWeight' | 'targetWeight' | 'notes'
			>
		>
	) {
		const wrapped = await encryptRecord('bodyPhases', { ...patch });
		await bodyPhaseTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deletePhase(id: string) {
		await bodyPhaseTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
