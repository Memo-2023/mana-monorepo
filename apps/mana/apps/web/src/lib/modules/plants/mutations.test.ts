/**
 * Integration tests for plants mutations against a real (fake) IndexedDB.
 *
 * Focus: wateringMutations.logWatering — the most consequential plants
 * write because it (a) appends a log and (b) re-anchors the schedule's
 * nextWateringAt, which drives every "needs water" badge in the UI.
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mana/shared-utils/analytics', () => ({
	PlantsEvents: {
		plantCreated: vi.fn(),
		plantDeleted: vi.fn(),
		plantWatered: vi.fn(),
	},
}));

// Database hooks call into funnel-tracking + trigger registry on every
// write. They reach for browser-only globals (localStorage), so stub them
// the same way cycles.integration.test.ts does.
vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '$lib/data/database';
import { setCurrentUserId } from '$lib/data/current-user';
import { generateMasterKey, MemoryKeyProvider, setKeyProvider } from '$lib/data/crypto';
import { wateringMutations } from './mutations';
import type { LocalWateringLog, LocalWateringSchedule } from './types';

const wateringLogs = () => db.table<LocalWateringLog>('wateringLogs');
const wateringSchedules = () => db.table<LocalWateringSchedule>('wateringSchedules');

beforeEach(async () => {
	setCurrentUserId('test-user');
	// Plants `plants` table is encrypted; install a real Web Crypto key
	// so any incidental reads/writes to it succeed. Watering tables
	// themselves are plaintext, but the test harness still requires the
	// vault to be unlocked because shared hooks call into the provider.
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await wateringLogs().clear();
	await wateringSchedules().clear();
	await db.table('plants').clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('wateringMutations.logWatering', () => {
	it('appends a watering log entry tagged with the plant id', async () => {
		await wateringMutations.logWatering('plant-1');

		const logs = await wateringLogs().toArray();
		expect(logs).toHaveLength(1);
		expect(logs[0].plantId).toBe('plant-1');
		expect(logs[0].wateredAt).toBeTruthy();
		expect(logs[0].id).toBeTruthy();
	});

	it('persists optional notes', async () => {
		await wateringMutations.logWatering('plant-1', 'Etwas Dünger dazu');

		const logs = await wateringLogs().toArray();
		expect(logs[0].notes).toBe('Etwas Dünger dazu');
	});

	it('does not touch the schedule when none exists for the plant', async () => {
		await wateringMutations.logWatering('plant-1');

		const schedules = await wateringSchedules().toArray();
		expect(schedules).toHaveLength(0);
	});

	it('re-anchors nextWateringAt to now + frequencyDays for an existing schedule', async () => {
		// Stale "next" date that should be replaced.
		await wateringSchedules().add({
			id: 'sched-1',
			plantId: 'plant-1',
			frequencyDays: 7,
			lastWateredAt: '2026-04-01T12:00:00.000Z',
			nextWateringAt: '2026-04-08T12:00:00.000Z',
			reminderEnabled: false,
			reminderHoursBefore: 0,
			createdAt: '2026-04-01T12:00:00.000Z',
			updatedAt: '2026-04-01T12:00:00.000Z',
		});

		// Capture a tight window around the call so we can assert the new
		// anchor falls inside it without depending on a frozen clock —
		// fake timers and Dexie's microtask scheduler don't play nicely.
		const before = Date.now();
		await wateringMutations.logWatering('plant-1');
		const after = Date.now();

		const updated = await wateringSchedules().get('sched-1');
		expect(updated?.lastWateredAt).toBeTruthy();

		const lastMs = new Date(updated!.lastWateredAt!).getTime();
		expect(lastMs).toBeGreaterThanOrEqual(before);
		expect(lastMs).toBeLessThanOrEqual(after);

		const nextMs = new Date(updated!.nextWateringAt!).getTime();
		const expectedDelta = 7 * 24 * 60 * 60 * 1000;
		// next should be ~ now + 7 days (within the same window slack)
		expect(nextMs - lastMs).toBeGreaterThanOrEqual(expectedDelta - 1000);
		expect(nextMs - lastMs).toBeLessThanOrEqual(expectedDelta + 1000);
	});

	it('does not update schedules of other plants', async () => {
		await wateringSchedules().bulkAdd([
			{
				id: 'sched-1',
				plantId: 'plant-1',
				frequencyDays: 7,
				lastWateredAt: null,
				nextWateringAt: '2026-04-08T12:00:00.000Z',
				reminderEnabled: false,
				reminderHoursBefore: 0,
				createdAt: '2026-04-01T12:00:00.000Z',
				updatedAt: '2026-04-01T12:00:00.000Z',
			},
			{
				id: 'sched-2',
				plantId: 'plant-2',
				frequencyDays: 3,
				lastWateredAt: null,
				nextWateringAt: '2026-04-09T12:00:00.000Z',
				reminderEnabled: false,
				reminderHoursBefore: 0,
				createdAt: '2026-04-01T12:00:00.000Z',
				updatedAt: '2026-04-01T12:00:00.000Z',
			},
		]);

		await wateringMutations.logWatering('plant-1');

		const other = await wateringSchedules().get('sched-2');
		expect(other?.nextWateringAt).toBe('2026-04-09T12:00:00.000Z'); // untouched
		expect(other?.lastWateredAt).toBeNull();
	});

	it('skips soft-deleted schedules', async () => {
		await wateringSchedules().add({
			id: 'sched-1',
			plantId: 'plant-1',
			frequencyDays: 7,
			lastWateredAt: null,
			nextWateringAt: '2026-04-08T12:00:00.000Z',
			reminderEnabled: false,
			reminderHoursBefore: 0,
			createdAt: '2026-04-01T12:00:00.000Z',
			updatedAt: '2026-04-01T12:00:00.000Z',
			deletedAt: '2026-04-02T12:00:00.000Z',
		});

		await wateringMutations.logWatering('plant-1');

		const stored = await wateringSchedules().get('sched-1');
		// Soft-deleted schedule should NOT have been re-anchored
		expect(stored?.lastWateredAt).toBeNull();
		expect(stored?.nextWateringAt).toBe('2026-04-08T12:00:00.000Z');

		// But the log entry itself should still be appended
		const logs = await wateringLogs().toArray();
		expect(logs).toHaveLength(1);
	});

	it('appends multiple logs across calls without overwriting prior entries', async () => {
		await wateringMutations.logWatering('plant-1');
		await wateringMutations.logWatering('plant-1');
		await wateringMutations.logWatering('plant-1');

		const logs = await wateringLogs().toArray();
		expect(logs).toHaveLength(3);
		const ids = new Set(logs.map((l) => l.id));
		expect(ids.size).toBe(3); // unique ids
	});
});
