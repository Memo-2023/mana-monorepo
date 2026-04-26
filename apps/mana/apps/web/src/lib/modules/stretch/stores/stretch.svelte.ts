/**
 * Stretch Store — mutation-only service for the stretch module.
 *
 * All reads happen via liveQuery hooks in queries.ts. This file only writes:
 * exercise CRUD, routine CRUD, session logging, assessments, and reminders.
 */

import { encryptRecord } from '$lib/data/crypto';
import {
	stretchExerciseTable,
	stretchRoutineTable,
	stretchSessionTable,
	stretchAssessmentTable,
	stretchReminderTable,
} from '../collections';
import {
	toStretchExercise,
	toStretchRoutine,
	toStretchSession,
	toStretchAssessment,
	toStretchReminder,
} from '../queries';
import type {
	LocalStretchExercise,
	LocalStretchRoutine,
	LocalStretchSession,
	LocalStretchAssessment,
	LocalStretchReminder,
	BodyRegion,
	Difficulty,
	RoutineType,
	RoutineExercise,
	AssessmentTest,
	PainRegion,
} from '../types';

export const stretchStore = {
	// ─── Exercises ──────────────────────────────────────────

	async createExercise(input: {
		name: string;
		description?: string;
		bodyRegion: BodyRegion;
		difficulty?: Difficulty;
		defaultDurationSec?: number;
		bilateral?: boolean;
		tags?: string[];
	}) {
		const existing = await stretchExerciseTable.toArray();
		const order = existing.filter((e) => !e.deletedAt).length;

		const newLocal: LocalStretchExercise = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? '',
			bodyRegion: input.bodyRegion,
			difficulty: input.difficulty ?? 'beginner',
			defaultDurationSec: input.defaultDurationSec ?? 30,
			bilateral: input.bilateral ?? false,
			tags: input.tags ?? [],
			isPreset: false,
			isArchived: false,
			order,
		};
		const snapshot = toStretchExercise({ ...newLocal });
		await encryptRecord('stretchExercises', newLocal);
		await stretchExerciseTable.add(newLocal);
		return snapshot;
	},

	async updateExercise(
		id: string,
		patch: Partial<
			Pick<
				LocalStretchExercise,
				| 'name'
				| 'description'
				| 'bodyRegion'
				| 'difficulty'
				| 'defaultDurationSec'
				| 'bilateral'
				| 'tags'
				| 'isArchived'
			>
		>
	) {
		const wrapped = await encryptRecord('stretchExercises', { ...patch });
		await stretchExerciseTable.update(id, {
			...wrapped,
		});
	},

	async deleteExercise(id: string) {
		const exercise = await stretchExerciseTable.get(id);
		if (!exercise || exercise.isPreset) return;
		await stretchExerciseTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	// ─── Routines ───────────────────────────────────────────

	async createRoutine(input: {
		name: string;
		description?: string;
		routineType?: RoutineType;
		targetBodyRegions?: BodyRegion[];
		exercises: RoutineExercise[];
		estimatedDurationMin?: number;
	}) {
		const existing = await stretchRoutineTable.toArray();
		const order = existing.filter((r) => !r.deletedAt).length;

		// Calculate estimated duration from exercises if not provided
		const totalSec = input.exercises.reduce((sum, e) => sum + e.durationSec + e.restAfterSec, 0);
		const estimatedMin = input.estimatedDurationMin ?? Math.ceil(totalSec / 60);

		const newLocal: LocalStretchRoutine = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? '',
			routineType: input.routineType ?? 'custom',
			targetBodyRegions: input.targetBodyRegions ?? [],
			exercises: input.exercises,
			estimatedDurationMin: estimatedMin,
			isPreset: false,
			isCustom: true,
			isPinned: false,
			order,
		};
		const snapshot = toStretchRoutine({ ...newLocal });
		await encryptRecord('stretchRoutines', newLocal);
		await stretchRoutineTable.add(newLocal);
		return snapshot;
	},

	async updateRoutine(
		id: string,
		patch: Partial<
			Pick<
				LocalStretchRoutine,
				| 'name'
				| 'description'
				| 'routineType'
				| 'targetBodyRegions'
				| 'exercises'
				| 'estimatedDurationMin'
				| 'isPinned'
				| 'order'
			>
		>
	) {
		const wrapped = await encryptRecord('stretchRoutines', { ...patch });
		await stretchRoutineTable.update(id, {
			...wrapped,
		});
	},

	async deleteRoutine(id: string) {
		const routine = await stretchRoutineTable.get(id);
		if (!routine || routine.isPreset) return;
		await stretchRoutineTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	async toggleRoutinePin(id: string) {
		const routine = await stretchRoutineTable.get(id);
		if (!routine) return;
		await stretchRoutineTable.update(id, {
			isPinned: !routine.isPinned,
		});
	},

	// ─── Sessions ───────────────────────────────────────────

	async startSession(input: {
		routineId: string | null;
		routineName: string;
		totalExercises: number;
	}) {
		const newLocal: LocalStretchSession = {
			id: crypto.randomUUID(),
			routineId: input.routineId,
			routineName: input.routineName,
			startedAt: new Date().toISOString(),
			endedAt: null,
			totalDurationSec: 0,
			completedExercises: 0,
			totalExercises: input.totalExercises,
			skippedExerciseIds: [],
			mood: null,
			notes: '',
		};
		const snapshot = toStretchSession({ ...newLocal });
		await encryptRecord('stretchSessions', newLocal);
		await stretchSessionTable.add(newLocal);
		return snapshot;
	},

	async finishSession(
		id: string,
		result: {
			totalDurationSec: number;
			completedExercises: number;
			skippedExerciseIds: string[];
			mood?: number | null;
			notes?: string;
		}
	) {
		const now = new Date().toISOString();
		const patch: Partial<LocalStretchSession> = {
			endedAt: now,
			totalDurationSec: result.totalDurationSec,
			completedExercises: result.completedExercises,
			skippedExerciseIds: result.skippedExerciseIds,
			mood: result.mood ?? null,
			notes: result.notes ?? '',
		};
		const wrapped = await encryptRecord('stretchSessions', { ...patch });
		await stretchSessionTable.update(id, {
			...wrapped,
		});
	},

	async deleteSession(id: string) {
		await stretchSessionTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	// ─── Assessments ────────────────────────────────────────

	async saveAssessment(input: {
		tests: AssessmentTest[];
		painRegions?: PainRegion[];
		notes?: string;
	}) {
		// Calculate overall score: average of all test scores, scaled to 0–100
		const totalScore = input.tests.reduce((sum, t) => sum + t.score, 0);
		const maxScore = input.tests.length * 5;
		const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

		const newLocal: LocalStretchAssessment = {
			id: crypto.randomUUID(),
			assessedAt: new Date().toISOString(),
			tests: input.tests,
			overallScore,
			painRegions: input.painRegions ?? [],
			notes: input.notes ?? '',
		};
		const snapshot = toStretchAssessment({ ...newLocal });
		await encryptRecord('stretchAssessments', newLocal);
		await stretchAssessmentTable.add(newLocal);
		return snapshot;
	},

	async deleteAssessment(id: string) {
		await stretchAssessmentTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	// ─── Reminders ──────────────────────────────────────────

	async createReminder(input: {
		name: string;
		routineId?: string | null;
		time: string;
		days: number[];
	}) {
		const newLocal: LocalStretchReminder = {
			id: crypto.randomUUID(),
			name: input.name,
			routineId: input.routineId ?? null,
			time: input.time,
			days: input.days,
			isActive: true,
			lastTriggeredAt: null,
		};
		const snapshot = toStretchReminder({ ...newLocal });
		await encryptRecord('stretchReminders', newLocal);
		await stretchReminderTable.add(newLocal);
		return snapshot;
	},

	async updateReminder(
		id: string,
		patch: Partial<Pick<LocalStretchReminder, 'name' | 'routineId' | 'time' | 'days' | 'isActive'>>
	) {
		const wrapped = await encryptRecord('stretchReminders', { ...patch });
		await stretchReminderTable.update(id, {
			...wrapped,
		});
	},

	async toggleReminder(id: string) {
		const reminder = await stretchReminderTable.get(id);
		if (!reminder) return;
		await stretchReminderTable.update(id, {
			isActive: !reminder.isActive,
		});
	},

	async deleteReminder(id: string) {
		await stretchReminderTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},
};
