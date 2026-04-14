/**
 * Integration tests for periods stores against a real (fake) IndexedDB.
 *
 * Covers the complex interactions that pure-function tests cannot:
 *   - periodsStore auto-closes the previous open period when a new one starts
 *   - dayLogsStore upserts per date (no duplicates)
 *   - dayLogsStore auto-creates a period on first bleeding log
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
import { periodsStore } from './periods.svelte';
import { dayLogsStore } from './dayLogs.svelte';
import { symptomsStore } from './symptoms.svelte';
import type { LocalPeriod, LocalPeriodDayLog, LocalPeriodSymptom } from '../types';

const periodTable = () => db.table<LocalPeriod>('periods');
const dayLogTable = () => db.table<LocalPeriodDayLog>('periodDayLogs');
const symptomTable = () => db.table<LocalPeriodSymptom>('periodSymptoms');

const iso = (dateStr: string) => dateStr; // alias for readability

async function resetPeriodsTables() {
	await periodTable().clear();
	await dayLogTable().clear();
	await symptomTable().clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
}

beforeEach(async () => {
	setCurrentUserId('test-user');
	// Phase 5 periods encryption requires an unlocked vault — install a
	// real Web Crypto key in a fresh MemoryKeyProvider for each test
	// run so the dayLogsStore.logDay calls below can encrypt notes/mood.
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);
	await resetPeriodsTables();
});

describe('periodsStore.createPeriod', () => {
	it('creates a single open period when none exists', async () => {
		const period = await periodsStore.createPeriod({ startDate: iso('2026-01-01') });
		expect(period.startDate).toBe('2026-01-01');
		expect(period.endDate).toBeNull();
		expect(period.length).toBeNull();

		const stored = await periodTable().toArray();
		expect(stored).toHaveLength(1);
		expect(stored[0].id).toBe(period.id);
	});

	it('auto-closes the previous open period and computes length', async () => {
		const first = await periodsStore.createPeriod({ startDate: iso('2026-01-01') });
		await periodsStore.createPeriod({ startDate: iso('2026-01-29') });

		const firstStored = await periodTable().get(first.id);
		expect(firstStored?.endDate).toBe('2026-01-28'); // day before new start
		expect(firstStored?.length).toBe(28);
	});

	it('does not touch periods whose startDate is >= the new period', async () => {
		// Backfilling an older period should NOT close a future one
		const future = await periodsStore.createPeriod({ startDate: iso('2026-03-01') });
		await periodsStore.createPeriod({ startDate: iso('2026-02-01') });

		const futureStored = await periodTable().get(future.id);
		expect(futureStored?.endDate).toBeNull();
		expect(futureStored?.length).toBeNull();
	});
});

describe('periodsStore.setPeriodEnd', () => {
	it('sets periodEndDate without affecting endDate', async () => {
		const c = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await periodsStore.setPeriodEnd(c.id, '2026-04-05');

		const stored = await periodTable().get(c.id);
		expect(stored?.periodEndDate).toBe('2026-04-05');
		expect(stored?.endDate).toBeNull();
	});
});

describe('periodsStore.deletePeriod', () => {
	it('soft-deletes via deletedAt', async () => {
		const c = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await periodsStore.deletePeriod(c.id);

		const stored = await periodTable().get(c.id);
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
		const logs = await decryptRecords<LocalPeriodDayLog>('periodDayLogs', raw);
		expect(logs).toHaveLength(1);
		expect(logs[0].flow).toBe('light');
		expect(logs[0].mood).toBe('good');
		expect(logs[0].temperature).toBe(36.6);
	});

	it('assigns periodId when a matching period exists', async () => {
		await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-05', mood: 'good' });

		const log = (await dayLogTable().toArray())[0];
		expect(log.periodId).toBeTruthy();
	});

	it('leaves periodId null when no period covers the date', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', mood: 'good' });
		const log = (await dayLogTable().toArray())[0];
		expect(log.periodId).toBeNull();
	});
});

describe('dayLogsStore.logDay — auto-start period', () => {
	it('creates a new period on first bleeding log with no history', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'medium' });

		const periods = await periodTable().toArray();
		expect(periods).toHaveLength(1);
		expect(periods[0].startDate).toBe('2026-04-07');

		// And the log itself is attached to that period
		const log = (await dayLogTable().toArray())[0];
		expect(log.periodId).toBe(periods[0].id);
	});

	it('does NOT create a new period for spotting', async () => {
		await dayLogsStore.logDay({ logDate: '2026-04-07', flow: 'spotting' });
		const periods = await periodTable().toArray();
		expect(periods).toHaveLength(0);
	});

	it('does NOT create a new period during an open period', async () => {
		await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		// Mid-period bleeding should NOT spawn a second period
		await dayLogsStore.logDay({ logDate: '2026-04-10', flow: 'medium' });

		const periods = await periodTable().toArray();
		expect(periods).toHaveLength(1);
	});

	it('creates a new period when the previous is closed and far enough apart', async () => {
		const first = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await periodsStore.setPeriodEnd(first.id, '2026-04-05');

		// 15 days after periodEndDate — well beyond MIN_GAP (10)
		await dayLogsStore.logDay({ logDate: '2026-04-20', flow: 'medium' });

		const periods = (await periodTable().toArray()).filter((c) => !c.deletedAt);
		expect(periods).toHaveLength(2);
	});

	it('does NOT create a new period if bleeding is too soon after period end', async () => {
		const first = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await periodsStore.setPeriodEnd(first.id, '2026-04-05');

		// Only 8 days after — treated as mid-period spotting
		await dayLogsStore.logDay({ logDate: '2026-04-13', flow: 'medium' });

		const periods = (await periodTable().toArray()).filter((c) => !c.deletedAt);
		expect(periods).toHaveLength(1);
	});
});

describe('dayLogsStore.logDay — auto-end period', () => {
	it('sets periodEndDate after 2 dry days following bleeding', async () => {
		const c = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-02', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-03', flow: 'light' });
		await dayLogsStore.logDay({ logDate: '2026-04-04', flow: 'none' });
		await dayLogsStore.logDay({ logDate: '2026-04-05', flow: 'none' });

		const stored = await periodTable().get(c.id);
		expect(stored?.periodEndDate).toBe('2026-04-03');
	});

	it('does NOT set periodEndDate after only 1 dry day', async () => {
		const c = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-02', flow: 'none' });

		const stored = await periodTable().get(c.id);
		expect(stored?.periodEndDate).toBeNull();
	});

	it('does not overwrite an already-set periodEndDate', async () => {
		const c = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await periodsStore.setPeriodEnd(c.id, '2026-04-03');

		// Logging more none days should not re-trigger
		await dayLogsStore.logDay({ logDate: '2026-04-01', flow: 'medium' });
		await dayLogsStore.logDay({ logDate: '2026-04-10', flow: 'none' });

		const stored = await periodTable().get(c.id);
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

describe('dayLogsStore.autoAssignPeriod', () => {
	it('retroactively attaches orphan logs to the right period', async () => {
		// Log something before any period exists
		await dayLogsStore.logDay({ logDate: '2026-04-07', mood: 'good' });
		const orphan = (await dayLogTable().toArray())[0];
		expect(orphan.periodId).toBeNull();

		// Now create a period that should claim that day
		const period = await periodsStore.createPeriod({ startDate: iso('2026-04-01') });
		await dayLogsStore.autoAssignPeriod();

		const reattached = await dayLogTable().get(orphan.id);
		expect(reattached?.periodId).toBe(period.id);
	});
});
