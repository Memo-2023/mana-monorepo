/**
 * Integration tests for bodyStore against a real (fake) IndexedDB.
 *
 * Focus areas:
 *   - Encryption: weight + reps + notes get wrapped via the registry
 *     allowlist, structural columns stay plaintext.
 *   - upsertCheck idempotency: re-tapping a daily check rating updates
 *     the same row instead of creating a second one.
 *   - startPhase auto-closes any previously open phase so the "active
 *     phase" view always sees at most one open row.
 *   - startWorkout returns the existing active session if one is
 *     already running (single-active guard).
 *   - logSet assigns the next order index relative to the existing
 *     non-deleted sets in the workout.
 *
 * Same harness as nutriphi/mutations.test.ts: fake-indexeddb + a
 * MemoryKeyProvider seeded with a fresh master key, plus mocks for
 * the browser-only globals the Dexie hooks reach for.
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '$lib/data/database';
import { setCurrentUserId } from '$lib/data/current-user';
import {
	generateMasterKey,
	MemoryKeyProvider,
	setKeyProvider,
	decryptRecord,
} from '$lib/data/crypto';
import { ENC_PREFIX } from '$lib/data/crypto/aes';
import { bodyStore } from './body.svelte';
import type {
	LocalBodyExercise,
	LocalBodySet,
	LocalBodyWorkout,
	LocalBodyCheck,
	LocalBodyPhase,
} from '../types';

const exercises = () => db.table<LocalBodyExercise>('bodyExercises');
const workouts = () => db.table<LocalBodyWorkout>('bodyWorkouts');
const sets = () => db.table<LocalBodySet>('bodySets');
const checks = () => db.table<LocalBodyCheck>('bodyChecks');
const phases = () => db.table<LocalBodyPhase>('bodyPhases');

beforeEach(async () => {
	setCurrentUserId('test-user');
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await Promise.all([
		exercises().clear(),
		workouts().clear(),
		sets().clear(),
		checks().clear(),
		phases().clear(),
		db.table('bodyMeasurements').clear(),
		db.table('bodyRoutines').clear(),
		db.table('_pendingChanges').clear(),
		db.table('_activity').clear(),
	]);
});

// ─── Encryption ─────────────────────────────────────────────

describe('bodyStore encryption', () => {
	it('encrypts exercise name + notes, leaves muscle group plaintext', async () => {
		await bodyStore.createExercise({
			name: 'Front Squat',
			muscleGroup: 'quads',
			equipment: 'barbell',
			notes: 'Heels elevated',
		});

		const raw = (await exercises().toArray())[0];
		expect(raw.name.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.notes!.startsWith(ENC_PREFIX)).toBe(true);
		// Structural columns stay plaintext for the index layer
		expect(raw.muscleGroup).toBe('quads');
		expect(raw.equipment).toBe('barbell');
		expect(raw.isPreset).toBe(false);

		const dec = await decryptRecord('bodyExercises', { ...raw });
		expect(dec.name).toBe('Front Squat');
		expect(dec.notes).toBe('Heels elevated');
	});

	it('encrypts set weight + reps but leaves workoutId / order plaintext', async () => {
		const w = await bodyStore.startWorkout({});
		const ex = await bodyStore.createExercise({
			name: 'Bench',
			muscleGroup: 'chest',
			equipment: 'barbell',
		});
		await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 5,
			weight: 100,
			weightUnit: 'kg',
		});

		const raw = (await sets().toArray())[0];
		// weight + reps are listed in the registry, so they get wrapped
		// (the wrapper JSON-stringifies numeric values before encrypting)
		expect(typeof raw.weight).toBe('string');
		expect(String(raw.weight).startsWith(ENC_PREFIX)).toBe(true);
		expect(typeof raw.reps).toBe('string');
		expect(String(raw.reps).startsWith(ENC_PREFIX)).toBe(true);
		// Plaintext index columns
		expect(raw.workoutId).toBe(w.id);
		expect(raw.exerciseId).toBe(ex.id);
		expect(raw.order).toBe(0);
		expect(raw.isWarmup).toBe(false);

		const dec = await decryptRecord('bodySets', { ...raw });
		expect(dec.weight).toBe(100);
		expect(dec.reps).toBe(5);
	});
});

// ─── upsertCheck idempotency ────────────────────────────────

describe('bodyStore.upsertCheck', () => {
	it('updates the existing row when re-tapping the same date', async () => {
		const today = new Date().toISOString().split('T')[0];

		await bodyStore.upsertCheck({ energy: 3 });
		expect(await checks().count()).toBe(1);

		await bodyStore.upsertCheck({ sleep: 4 });
		expect(await checks().count()).toBe(1);

		await bodyStore.upsertCheck({ mood: 5, soreness: 2 });
		expect(await checks().count()).toBe(1);

		const raw = (await checks().toArray())[0];
		const dec = await decryptRecord('bodyChecks', { ...raw });
		expect(dec.date).toBe(today);
		expect(dec.energy).toBe(3);
		expect(dec.sleep).toBe(4);
		expect(dec.mood).toBe(5);
		expect(dec.soreness).toBe(2);
	});

	it('preserves prior fields when partial updates pass undefined', async () => {
		await bodyStore.upsertCheck({ energy: 4, sleep: 3 });
		await bodyStore.upsertCheck({ mood: 5 });

		const raw = (await checks().toArray())[0];
		const dec = await decryptRecord('bodyChecks', { ...raw });
		// energy and sleep must survive the second upsert, mood is added
		expect(dec.energy).toBe(4);
		expect(dec.sleep).toBe(3);
		expect(dec.mood).toBe(5);
	});

	it('creates a new row for a different date', async () => {
		await bodyStore.upsertCheck({ date: '2026-04-08', energy: 3 });
		await bodyStore.upsertCheck({ date: '2026-04-09', energy: 4 });
		expect(await checks().count()).toBe(2);
	});
});

// ─── Phase auto-close ───────────────────────────────────────

describe('bodyStore.startPhase', () => {
	it('auto-closes the previously open phase before opening a new one', async () => {
		const a = await bodyStore.startPhase({ kind: 'cut', startWeight: 80 });
		const b = await bodyStore.startPhase({ kind: 'bulk', startWeight: 75 });

		const all = (await phases().toArray()).filter((p) => !p.deletedAt);
		expect(all).toHaveLength(2);

		const closed = all.find((p) => p.id === a.id)!;
		const open = all.find((p) => p.id === b.id)!;
		expect(closed.endDate).not.toBeNull();
		expect(open.endDate).toBeNull();
	});

	it('endPhase stamps endDate without deleting the row', async () => {
		const p = await bodyStore.startPhase({ kind: 'maintenance' });
		await bodyStore.endPhase(p.id);
		const raw = (await phases().toArray()).find((r) => r.id === p.id)!;
		expect(raw.endDate).not.toBeNull();
		expect(raw.deletedAt).toBeUndefined();
	});
});

// ─── Workout single-active guard ───────────────────────────

describe('bodyStore.startWorkout', () => {
	it('returns the existing open workout instead of starting a second one', async () => {
		const first = await bodyStore.startWorkout({ title: 'Pull Day' });
		const second = await bodyStore.startWorkout({ title: 'Push Day' });

		expect(second.id).toBe(first.id);
		const all = (await workouts().toArray()).filter((w) => !w.deletedAt);
		expect(all).toHaveLength(1);
	});

	it('starts a new workout once the previous one has been finished', async () => {
		const first = await bodyStore.startWorkout({});
		await bodyStore.finishWorkout(first.id);
		const second = await bodyStore.startWorkout({});
		expect(second.id).not.toBe(first.id);

		const all = (await workouts().toArray()).filter((w) => !w.deletedAt);
		expect(all).toHaveLength(2);
	});
});

// ─── Set order assignment ──────────────────────────────────

describe('bodyStore.logSet', () => {
	it('assigns the next sequential order within a workout', async () => {
		const w = await bodyStore.startWorkout({});
		const ex = await bodyStore.createExercise({
			name: 'Squat',
			muscleGroup: 'quads',
			equipment: 'barbell',
		});

		const s1 = await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 5,
			weight: 100,
			weightUnit: 'kg',
		});
		const s2 = await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 5,
			weight: 102.5,
			weightUnit: 'kg',
		});
		const s3 = await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 5,
			weight: 105,
			weightUnit: 'kg',
		});

		expect(s1.order).toBe(0);
		expect(s2.order).toBe(1);
		expect(s3.order).toBe(2);
	});

	it('deleteWorkout soft-deletes the workout AND all its sets', async () => {
		const w = await bodyStore.startWorkout({});
		const ex = await bodyStore.createExercise({
			name: 'Row',
			muscleGroup: 'back',
			equipment: 'barbell',
		});
		await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 8,
			weight: 60,
			weightUnit: 'kg',
		});
		await bodyStore.logSet({
			workoutId: w.id,
			exerciseId: ex.id,
			reps: 8,
			weight: 60,
			weightUnit: 'kg',
		});

		await bodyStore.deleteWorkout(w.id);

		const wRow = (await workouts().toArray()).find((r) => r.id === w.id)!;
		expect(wRow.deletedAt).toBeTruthy();

		const wSets = await sets().where('workoutId').equals(w.id).toArray();
		expect(wSets).toHaveLength(2);
		for (const s of wSets) {
			expect(s.deletedAt).toBeTruthy();
		}
	});
});
