/**
 * Integration tests for cycles stores against a real (fake) IndexedDB.
 *
 * Covers the complex interactions that pure-function tests cannot:
 *   - cyclesStore auto-closes the previous open cycle when a new one starts
 *   - dayLogsStore upserts per date (no duplicates)
 *   - dayLogsStore auto-creates a cycle on first bleeding log
 *   - dayLogsStore auto-sets periodEndDate after 2 dry days
 *   - symptomsStore.touchSymptoms increments/decrements ref counts
 *   - dayLogsStore updates symptom counters when symptoms change on an existing log
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
	decryptRecords,
} from '$lib/data/crypto';
import { cyclesStore } from './cycles.svelte';
import { dayLogsStore } from './dayLogs.svelte';
import { symptomsStore } from './symptoms.svelte';
import type { LocalCycle, LocalCycleDayLog, LocalCycleSymptom } from '../types';

const cycleTable = () => db.table<LocalCycle>('cycles');
const dayLogTable = () => db.table<LocalCycleDayLog>('cycleDayLogs');
const symptomTable = () => db.table<LocalCycleSymptom>('cycleSymptoms');

const iso = (dateStr: string) => dateStr; // alias for readability

async function resetCyclesTables() {
	await cycleTable().clear();
	await dayLogTable().clear();
	await symptomTable().clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
}

beforeEach(async () => {
	setCurrentUserId('test-user');
	// Phase 5 cycles encryption requires an unlocked vault — install a
	// real Web Crypto key in a fresh MemoryKeyProvider for each test
	// run so the dayLogsStore.logDay calls below can encrypt notes/mood.
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);
	await resetCyclesTables();
});

describe('cyclesStore.createCycle', () => {
	it('creates a single open cycle when none exists', async () => {
		const cycle = await cyclesStore.createCycle({ startDate: iso('2026-01-01') });
		expect(cycle.startDate).toBe('2026-01-01');
		expect(cycle.endDate).toBeNull();
		expect(cycle.length).toBeNull();

		const stored = await cycleTable().toArray();
		expect(stored).toHaveLength(1);
		expect(stored[0].id).toBe(cycle.id);
	});

	it('auto-closes the previous open cycle and computes length', async () => {
		const first = await cyclesStore.createCycle({ startDate: iso('2026-01-01') });
		await cyclesStore.createCycle({ startDate: iso('2026-01-29') });

		const firstStored = await cycleTable().get(first.id);
		expect(firstStored?.endDate).toBe('2026-01-28'); // day before new start
		expect(firstStored?.length).toBe(28);
	});

	it('does not touch cycles whose startDate is >= the new cycle', async () => {
		// Backfilling an older cycle should NOT close a future one
		const future = await cyclesStore.createCycle({ startDate: iso('2026-03-01') });
		await cyclesStore.createCycle({ startDate: iso('2026-02-01') });

		const futureStored = await cycleTable().get(future.id);
		expect(futureStored?.endDate).toBeNull();
		expect(futureStored?.length).toBeNull();
	});
});

describe('cyclesStore.setPeriodEnd', () => {
	it('sets periodEndDate without affecting endDate', async () => {
		const c = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await cyclesStore.setPeriodEnd(c.id, '2026-04-05');

		const stored = await cycleTable().get(c.id);
		expect(stored?.periodEndDate).toBe('2026-04-05');
		expect(stored?.endDate).toBeNull();
	});
});

describe('cyclesStore.deleteCycle', () => {
	it('soft-deletes via deletedAt', async () => {
		const c = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await cyclesStore.deleteCycle(c.id);

		const stored = await cycleTable().get(c.id);
		expect(stored?.deletedAt).toBeTruthy();
	});
});

describe('dayLogsStore.logDay — upsert behavior', () => {
	it('creates a single log for a new date', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'light' });

		const logs = await dayLogTable().toArray();
		expect(logs).toHaveLength(1);
		expect(logs[0].logDate).toBe('2026-04-07');
		expect(logs[0].flow).toBe('light');
	});

	it('updates the existing log for the same date (no duplicate)', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'light' });
		await dayLogsStore.logDay({ logDate: '2026-04-07', mood: 'good' });
		await dayLogsStore.logDay({ logDate: '2026-04-07', temperature: 36.6 });

		// Phase 5: `mood` is encrypted on disk — decrypt before asserting
		// so the test reads the same view the UI does.
		const raw = (await dayLogTable().toArray()).filter((l) => !l.deletedAt);
		const logs = await decryptRecords<LocalCycleDayLog>('cycleDayLogs', raw);
		expect(logs).toHaveLength(1);
		expect(logs[0].flow).toBe('light');
		expect(logs[0].mood).toBe('good');
		expect(logs[0].temperature).toBe(36.6);
	});

	it('assigns cycleId when a matching cycle exists', async () => {
		await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-05', mood: 'good' });

		const log = (await dayLogTable().toArray())[0];
		expect(log.cycleId).toBeTruthy();
	});

	it('leaves cycleId null when no cycle covers the date', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', mood: 'good' });
		const log = (await dayLogTable().toArray())[0];
		expect(log.cycleId).toBeNull();
	});
});

describe('dayLogsStore.logDay — auto-start cycle', () => {
	it('creates a new cycle on first bleeding log with no history', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'medium' });

		const cycles = await cycleTable().toArray();
		expect(cycles).toHaveLength(1);
		expect(cycles[0].startDate).toBe('2026-04-07');

		// And the log itself is attached to that cycle
		const log = (await dayLogTable().toArray())[0];
		expect(log.cycleId).toBe(cycles[0].id);
	});

	it('does NOT create a new cycle for spotting', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'spotting' });
		const cycles = await cycleTable().toArray();
		expect(cycles).toHaveLength(0);
	});

	it('does NOT create a new cycle during an open cycle', async () => {
		await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		// Mid-cycle bleeding should NOT spawn a second cycle
		await dayLogsStore.logDay({ logDate: '2026-04-10', flow: 'medium' });

		const cycles = await cycleTable().toArray();
		expect(cycles).toHaveLength(1);
	});

	it('creates a new cycle when the previous is closed and far enough apart', async () => {
		const first = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await cyclesStore.setPeriodEnd(first.id, '2026-04-05');

		// 15 days after periodEndDate — well beyond MIN_GAP (10)
		await dayLogsStore.logDay({ logDate: '2026-04-20', flow: 'medium' });

		const cycles = (await cycleTable().toArray()).filter((c) => !c.deletedAt);
		expect(cycles).toHaveLength(2);
	});

	it('does NOT create a new cycle if bleeding is too soon after period end', async () => {
		const first = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await cyclesStore.setPeriodEnd(first.id, '2026-04-05');

		// Only 8 days after — treated as mid-cycle spotting
		await dayLogsStore.logDay({ logDate: '2026-04-13', flow: 'medium' });

		const cycles = (await cycleTable().toArray()).filter((c) => !c.deletedAt);
		expect(cycles).toHaveLength(1);
	});
});

describe('dayLogsStore.logDay — auto-end period', () => {
	it('sets periodEndDate after 2 dry days following bleeding', async () => {
		const c = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-02', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-03', flow: 'light' });
		await dayLogsStore.logDay({ logDate: '2026-04-04', flow: 'none' });
		await dayLogsStore.logDay({ logDate: '2026-04-05', flow: 'none' });

		const stored = await cycleTable().get(c.id);
		expect(stored?.periodEndDate).toBe('2026-04-03');
	});

	it('does NOT set periodEndDate after only 1 dry day', async () => {
		const c = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-02', flow: 'none' });

		const stored = await cycleTable().get(c.id);
		expect(stored?.periodEndDate).toBeNull();
	});

	it('does not overwrite an already-set periodEndDate', async () => {
		const c = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await cyclesStore.setPeriodEnd(c.id, '2026-04-03');

		// Logging more none days should not re-trigger
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-10', flow: 'none' });

		const stored = await cycleTable().get(c.id);
		expect(stored?.periodEndDate).toBe('2026-04-03');
	});
});

describe('symptomsStore.touchSymptoms', () => {
	it('increments count for existing symptoms', async () => {
		const sym = await symptomsStore.createSymptom({ name: 'Krämpfe', category: 'physical' });
		await symptomsStore.touchSymptoms([sym.id], +1);
		await symptomsStore.touchSymptoms([sym.id], +1);

		const stored = await symptomTable().get(sym.id);
		expect(stored?.count).toBe(2);
	});

	it('decrements count but never goes below zero', async () => {
		const sym = await symptomsStore.createSymptom({ name: 'Kopfschmerzen' });
		await symptomsStore.touchSymptoms([sym.id], -5);

		const stored = await symptomTable().get(sym.id);
		expect(stored?.count).toBe(0);
	});

	it('skips unknown IDs silently', async () => {
		await expect(symptomsStore.touchSymptoms(['does-not-exist'], +1)).resolves.toBeUndefined();
	});
});

describe('dayLogsStore.logDay — symptom counter integration', () => {
	it('increments counters when adding new symptoms', async () => {
		const cramps = await symptomsStore.createSymptom({ name: 'Krämpfe' });
		const headache = await symptomsStore.createSymptom({ name: 'Kopfschmerzen' });

		await dayLogsStore.logDay({ logDate: '2026-04-07', symptoms: [cramps.id, headache.id] });

		expect((await symptomTable().get(cramps.id))?.count).toBe(1);
		expect((await symptomTable().get(headache.id))?.count).toBe(1);
	});

	it('adjusts counters when symptoms change on an existing log', async () => {
		const cramps = await symptomsStore.createSymptom({ name: 'Krämpfe' });
		const headache = await symptomsStore.createSymptom({ name: 'Kopfschmerzen' });
		const bloating = await symptomsStore.createSymptom({ name: 'Blähbauch' });

		await dayLogsStore.logDay({ logDate: '2026-04-07', symptoms: [cramps.id, headache.id] });
		// Remove headache, add bloating
		await dayLogsStore.logDay({ logDate: '2026-04-07', symptoms: [cramps.id, bloating.id] });

		expect((await symptomTable().get(cramps.id))?.count).toBe(1); // unchanged
		expect((await symptomTable().get(headache.id))?.count).toBe(0); // removed
		expect((await symptomTable().get(bloating.id))?.count).toBe(1); // added
	});

	it('decrements counters when deleting a log', async () => {
		const cramps = await symptomsStore.createSymptom({ name: 'Krämpfe' });
		const log = await dayLogsStore.logDay({ logDate: '2026-04-07', symptoms: [cramps.id] });

		expect((await symptomTable().get(cramps.id))?.count).toBe(1);

		await dayLogsStore.deleteLog(log.id);
		expect((await symptomTable().get(cramps.id))?.count).toBe(0);
	});
});

describe('dayLogsStore.autoAssignCycle', () => {
	it('retroactively attaches orphan logs to the right cycle', async () => {
		// Log something before any cycle exists
		await dayLogsStore.logDay({ logDate: '2026-04-07', mood: 'good' });
		const orphan = (await dayLogTable().toArray())[0];
		expect(orphan.cycleId).toBeNull();

		// Now create a cycle that should claim that day
		const cycle = await cyclesStore.createCycle({ startDate: iso('2026-04-01') });
		await dayLogsStore.autoAssignCycle();

		const reattached = await dayLogTable().get(orphan.id);
		expect(reattached?.cycleId).toBe(cycle.id);
	});
});
