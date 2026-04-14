import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import {
	createMission,
	getMission,
	listMissions,
	updateMission,
	pauseMission,
	resumeMission,
	completeMission,
	archiveMission,
	deleteMission,
	startIteration,
	finishIteration,
	addIterationFeedback,
} from './store';
import { MISSIONS_TABLE } from './types';
import type { MissionCadence } from './types';

const DAILY: MissionCadence = { kind: 'daily', atHour: 9, atMinute: 0 };

beforeEach(async () => {
	await db.table(MISSIONS_TABLE).clear();
});

describe('mission CRUD', () => {
	it('creates an active mission with a scheduled next run', async () => {
		const m = await createMission({
			title: 'Weekly review',
			conceptMarkdown: '# Do a weekly review',
			objective: 'Review progress every Monday',
			cadence: DAILY,
		});
		expect(m.state).toBe('active');
		expect(m.iterations).toHaveLength(0);
		expect(m.nextRunAt).toBeTruthy();
		expect(await getMission(m.id)).toBeTruthy();
	});

	it('listMissions filters by state', async () => {
		const a = await createMission({
			title: 'A',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		await createMission({
			title: 'B',
			conceptMarkdown: '',
			objective: 'y',
			cadence: { kind: 'manual' },
		});
		await pauseMission(a.id);

		const active = await listMissions({ state: 'active' });
		const paused = await listMissions({ state: 'paused' });
		expect(active).toHaveLength(1);
		expect(paused).toHaveLength(1);
	});

	it('listMissions dueBefore only returns active missions past their nextRunAt', async () => {
		const m = await createMission({
			title: 'Due now',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'interval', everyMinutes: 1 },
		});
		// force nextRunAt into the past
		await db.table(MISSIONS_TABLE).update(m.id, {
			nextRunAt: '2020-01-01T00:00:00.000Z',
		});
		const due = await listMissions({ dueBefore: new Date().toISOString() });
		expect(due).toHaveLength(1);
	});

	it('updateMission with a new cadence recomputes nextRunAt', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		expect(m.nextRunAt).toBeUndefined();
		await updateMission(m.id, { cadence: { kind: 'interval', everyMinutes: 30 } });
		const updated = await getMission(m.id);
		expect(updated?.nextRunAt).toBeTruthy();
	});

	it('pause / resume flip state and rescheduling', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: DAILY,
		});
		await pauseMission(m.id);
		expect((await getMission(m.id))?.state).toBe('paused');
		await resumeMission(m.id);
		const resumed = await getMission(m.id);
		expect(resumed?.state).toBe('active');
		expect(resumed?.nextRunAt).toBeTruthy();
	});

	it('complete clears nextRunAt', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: DAILY,
		});
		await completeMission(m.id);
		const done = await getMission(m.id);
		expect(done?.state).toBe('done');
		expect(done?.nextRunAt).toBeUndefined();
	});

	it('archive + soft-delete', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		await archiveMission(m.id);
		expect((await getMission(m.id))?.state).toBe('archived');

		await deleteMission(m.id);
		const all = await listMissions();
		expect(all).toHaveLength(0);
	});
});

describe('mission iterations', () => {
	it('appends a running iteration and finishes with summary + status', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: DAILY,
		});
		const it = await startIteration(m.id, {
			plan: [
				{
					id: 'step-1',
					summary: 'Propose a task',
					intent: { kind: 'toolCall', toolName: 'create_task', params: { title: 'foo' } },
					status: 'planned',
				},
			],
		});

		const midRun = await getMission(m.id);
		expect(midRun?.iterations).toHaveLength(1);
		expect(midRun?.iterations[0].overallStatus).toBe('running');

		await finishIteration(m.id, it.id, {
			summary: 'Proposed a task',
			overallStatus: 'awaiting-review',
		});
		const done = await getMission(m.id);
		expect(done?.iterations[0].overallStatus).toBe('awaiting-review');
		expect(done?.iterations[0].finishedAt).toBeTruthy();
		expect(done?.iterations[0].summary).toBe('Proposed a task');
	});

	it('attaches user feedback to the iteration', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: DAILY,
		});
		const it = await startIteration(m.id, { plan: [] });
		await finishIteration(m.id, it.id, { overallStatus: 'awaiting-review' });
		await addIterationFeedback(m.id, it.id, 'too aggressive — dial back');

		const after = await getMission(m.id);
		expect(after?.iterations[0].userFeedback).toBe('too aggressive — dial back');
	});
});
