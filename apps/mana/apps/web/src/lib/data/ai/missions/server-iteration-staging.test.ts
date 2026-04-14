import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { registerTools } from '../../tools/registry';
import { setAiPolicy } from '../policy';
import { createMission, finishIteration, startIteration } from './store';
import { MISSIONS_TABLE } from './types';
import { listProposals } from '../proposals/store';
import { PROPOSALS_TABLE } from '../proposals/types';
import {
	startServerIterationStaging,
	stopServerIterationStaging,
	resetServerIterationStagingCache,
} from './server-iteration-staging';

registerTools([
	{
		name: 'staging_test_op',
		module: 'stagingTest',
		description: 'propose only',
		parameters: [{ name: 'val', type: 'string', required: true, description: 'v' }],
		async execute() {
			return { success: true, message: 'ok' };
		},
	},
]);

const flush = () => new Promise((r) => setTimeout(r, 50));

beforeEach(async () => {
	await db.table(MISSIONS_TABLE).clear();
	await db.table(PROPOSALS_TABLE).clear();
	resetServerIterationStagingCache();
});

afterEach(() => {
	stopServerIterationStaging();
});

describe('server-iteration staging', () => {
	it('translates a server iteration into local proposals', async () => {
		const restore = setAiPolicy({
			tools: { staging_test_op: 'propose' },
			defaultForAi: 'propose',
		});
		try {
			const m = await createMission({
				title: 'x',
				conceptMarkdown: '',
				objective: 'x',
				cadence: { kind: 'manual' },
			});
			// Simulate what mana-ai's write-back would sync into Dexie
			const it = await startIteration(m.id, {
				plan: [
					{
						id: 'srv-step-1',
						summary: 'server step',
						intent: {
							kind: 'toolCall',
							toolName: 'staging_test_op',
							params: { val: 'hello' },
						},
						status: 'planned',
					},
				],
			});
			await finishIteration(m.id, it.id, {
				overallStatus: 'awaiting-review',
			});
			// Stamp source='server' — startIteration/finishIteration don't
			// set it; the write-back path from mana-ai does.
			const row = await db.table(MISSIONS_TABLE).get(m.id);
			const patched = row.iterations.map((x: { id: string }) =>
				x.id === it.id ? { ...x, source: 'server' } : x
			);
			await db.table(MISSIONS_TABLE).update(m.id, { iterations: patched });

			startServerIterationStaging();
			await flush();
			await flush();

			const proposals = await listProposals({ status: 'pending' });
			expect(proposals).toHaveLength(1);
			expect(proposals[0].missionId).toBe(m.id);
			expect(proposals[0].iterationId).toBe(it.id);
			expect(proposals[0].intent).toMatchObject({
				kind: 'toolCall',
				toolName: 'staging_test_op',
				params: { val: 'hello' },
			});
		} finally {
			restore();
		}
	});

	it('does not re-stage an iteration that already has proposalIds', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		const it = await startIteration(m.id, {
			plan: [
				{
					id: 'srv-step-1',
					summary: 's',
					intent: {
						kind: 'toolCall',
						toolName: 'staging_test_op',
						params: { val: 'x' },
					},
					status: 'staged',
					proposalId: 'already-there',
				},
			],
		});
		await finishIteration(m.id, it.id, { overallStatus: 'awaiting-review' });
		const row = await db.table(MISSIONS_TABLE).get(m.id);
		const patched = row.iterations.map((x: { id: string }) =>
			x.id === it.id ? { ...x, source: 'server' } : x
		);
		await db.table(MISSIONS_TABLE).update(m.id, { iterations: patched });

		startServerIterationStaging();
		await flush();
		await flush();

		const proposals = await listProposals({ status: 'pending' });
		expect(proposals).toHaveLength(0);
	});

	it('ignores browser-sourced iterations', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		const it = await startIteration(m.id, {
			plan: [
				{
					id: 'browser-step',
					summary: 's',
					intent: {
						kind: 'toolCall',
						toolName: 'staging_test_op',
						params: { val: 'x' },
					},
					status: 'planned',
				},
			],
		});
		await finishIteration(m.id, it.id, { overallStatus: 'awaiting-review' });
		// leave source unset (defaults to 'browser')

		startServerIterationStaging();
		await flush();

		const proposals = await listProposals({ status: 'pending' });
		expect(proposals).toHaveLength(0);
	});
});
