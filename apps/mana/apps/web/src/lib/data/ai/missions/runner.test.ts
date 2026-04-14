import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { registerTools } from '../../tools/registry';
import { setAiPolicy } from '../policy';
import { createMission, getMission, pauseMission } from './store';
import { runMission, runDueMissions } from './runner';
import {
	registerInputResolver,
	unregisterInputResolver,
	resolveMissionInputs,
} from './input-resolvers';
import { MISSIONS_TABLE } from './types';
import type { AiPlanInput, AiPlanOutput } from './planner/types';

let executed: { name: string; params: Record<string, unknown> }[] = [];

registerTools([
	{
		name: 'runner_test_stage',
		module: 'runnerTest',
		description: 'proposes',
		parameters: [{ name: 'val', type: 'string', required: true, description: 'v' }],
		async execute(params) {
			executed.push({ name: 'runner_test_stage', params: { ...params } });
			return { success: true, message: 'ok' };
		},
	},
]);

beforeEach(async () => {
	executed = [];
	await db.table(MISSIONS_TABLE).clear();
	await db.table('pendingProposals').clear();
});

describe('runMission', () => {
	it('runs the planner, stages proposals, and marks the iteration awaiting-review', async () => {
		const restore = setAiPolicy({
			tools: { runner_test_stage: 'propose' },
			defaultForAi: 'propose',
		});
		try {
			const m = await createMission({
				title: 'Test mission',
				conceptMarkdown: '',
				objective: 'test',
				cadence: { kind: 'manual' },
			});
			const planStub: AiPlanOutput = {
				summary: 'Staged a test step',
				steps: [
					{
						summary: 'Do a thing',
						toolName: 'runner_test_stage',
						params: { val: 'hello' },
						rationale: 'because test',
					},
				],
			};
			const result = await runMission(m.id, {
				plan: async (_input: AiPlanInput) => planStub,
			});

			expect(result.plannedSteps).toBe(1);
			expect(result.stagedSteps).toBe(1);
			expect(result.iteration.overallStatus).toBe('awaiting-review');

			const after = await getMission(m.id);
			expect(after?.iterations).toHaveLength(1);
			expect(after?.iterations[0].plan[0].proposalId).toBeTruthy();
			expect(after?.iterations[0].plan[0].status).toBe('staged');

			// Tool did NOT execute — proposal was staged
			expect(executed).toHaveLength(0);
		} finally {
			restore();
		}
	});

	it('passes the built AiPlanInput to the planner with mission + tool allowlist', async () => {
		const restore = setAiPolicy({
			tools: { runner_test_stage: 'propose' },
			defaultForAi: 'deny',
		});
		try {
			const m = await createMission({
				title: 'Test',
				conceptMarkdown: '',
				objective: 'test',
				cadence: { kind: 'manual' },
			});
			let captured: AiPlanInput | null = null;
			await runMission(m.id, {
				plan: async (input) => {
					captured = input;
					return { summary: '', steps: [] };
				},
			});
			expect(captured).toBeTruthy();
			expect(captured!.mission.id).toBe(m.id);
			const allowedNames = captured!.availableTools.map((t) => t.name);
			expect(allowedNames).toContain('runner_test_stage');
		} finally {
			restore();
		}
	});

	it('marks an iteration failed when the planner throws', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		const result = await runMission(m.id, {
			plan: async () => {
				throw new Error('planner down');
			},
		});
		expect(result.iteration.overallStatus).toBe('failed');
		const after = await getMission(m.id);
		expect(after?.iterations[0].overallStatus).toBe('failed');
		expect(after?.iterations[0].summary).toContain('planner down');
	});

	it('produces an approved iteration when planner returns zero steps', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		const result = await runMission(m.id, {
			plan: async () => ({ summary: 'nothing needed', steps: [] }),
		});
		expect(result.iteration.overallStatus).toBe('approved');
	});

	it('refuses to run a paused mission', async () => {
		const m = await createMission({
			title: 'x',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'manual' },
		});
		await pauseMission(m.id);
		await expect(
			runMission(m.id, { plan: async () => ({ summary: '', steps: [] }) })
		).rejects.toThrow(/paused/);
	});
});

describe('runDueMissions', () => {
	it('runs only active missions whose nextRunAt has passed', async () => {
		const a = await createMission({
			title: 'due',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'interval', everyMinutes: 5 },
		});
		const b = await createMission({
			title: 'future',
			conceptMarkdown: '',
			objective: 'x',
			cadence: { kind: 'interval', everyMinutes: 5 },
		});
		// Force `a` into the past, leave `b` in the future
		await db.table(MISSIONS_TABLE).update(a.id, { nextRunAt: '2020-01-01T00:00:00.000Z' });

		const runs: string[] = [];
		await runDueMissions(new Date(), {
			plan: async (input) => {
				runs.push(input.mission.id);
				return { summary: '', steps: [] };
			},
		});
		expect(runs).toEqual([a.id]);
		expect(runs).not.toContain(b.id);
	});
});

describe('resolveMissionInputs', () => {
	it('resolves via registered resolvers and skips missing modules', async () => {
		registerInputResolver('testmod', async (ref) => ({
			id: ref.id,
			module: 'testmod',
			table: ref.table,
			title: 'T',
			content: `content for ${ref.id}`,
		}));
		try {
			const refs = [
				{ module: 'testmod', table: 't', id: 'a' },
				{ module: 'nope', table: 't', id: 'b' },
			];
			const resolved = await resolveMissionInputs(refs);
			expect(resolved).toHaveLength(1);
			expect(resolved[0].content).toContain('a');
		} finally {
			unregisterInputResolver('testmod');
		}
	});

	it('returns empty array when nothing is registered', async () => {
		const r = await resolveMissionInputs([{ module: 'unknown', table: 't', id: 'x' }]);
		expect(r).toEqual([]);
	});
});
