import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { registerTools } from '../../tools/registry';
import { createMission, getMission } from './store';
import { runMission } from './runner';
import { MISSIONS_TABLE } from './types';
import type { LlmClient, LlmCompletionRequest, LlmCompletionResponse } from '@mana/shared-ai';

let executed: { name: string; params: Record<string, unknown> }[] = [];

registerTools([
	{
		name: 'runner_test_action',
		module: 'runnerTest',
		description: 'test action',
		parameters: [{ name: 'val', type: 'string', required: true, description: 'v' }],
		async execute(params) {
			executed.push({ name: 'runner_test_action', params: { ...params } });
			return { success: true, message: `did ${params.val}` };
		},
	},
]);

beforeEach(async () => {
	executed = [];
	await db.table(MISSIONS_TABLE).clear();
});

/** Minimal LlmClient for runner tests — scripts one or more assistant
 *  turns via enqueueToolCalls / enqueueStop. */
function mockLlm(
	turns: Array<
		| { kind: 'tool_calls'; calls: Array<{ name: string; args: Record<string, unknown> }> }
		| { kind: 'stop'; content?: string }
	>
): LlmClient {
	let i = 0;
	return {
		async complete(_req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
			const turn = turns[i++];
			if (!turn) throw new Error('MockLlm exhausted');
			if (turn.kind === 'stop') {
				return { content: turn.content ?? null, toolCalls: [], finishReason: 'stop' };
			}
			return {
				content: null,
				toolCalls: turn.calls.map((c, n) => ({
					id: `call_${i}_${n}`,
					name: c.name,
					arguments: c.args,
				})),
				finishReason: 'tool_calls',
			};
		},
	};
}

describe('runMission', () => {
	it('executes a tool_call directly and records it in the iteration', async () => {
		const m = await createMission({
			title: 'Test mission',
			conceptMarkdown: '',
			objective: 'test',
			cadence: { kind: 'manual' },
		});

		const llm = mockLlm([
			{ kind: 'tool_calls', calls: [{ name: 'runner_test_action', args: { val: 'hello' } }] },
			{ kind: 'stop', content: 'done' },
		]);

		const result = await runMission(m.id, { llm });

		expect(result.plannedSteps).toBe(1);
		expect(result.failedSteps).toBe(0);
		expect(result.iteration.overallStatus).toBe('approved');
		expect(executed).toEqual([{ name: 'runner_test_action', params: { val: 'hello' } }]);

		const after = await getMission(m.id);
		expect(after?.iterations).toHaveLength(1);
		expect(after?.iterations[0].plan).toHaveLength(1);
		expect(after?.iterations[0].plan[0].status).toBe('approved');
	});

	it('marks the iteration approved with zero steps when the LLM just stops', async () => {
		const m = await createMission({
			title: 'Empty',
			conceptMarkdown: '',
			objective: 'nothing to do',
			cadence: { kind: 'manual' },
		});

		const llm = mockLlm([{ kind: 'stop', content: 'nichts zu tun' }]);
		const result = await runMission(m.id, { llm });

		expect(result.plannedSteps).toBe(0);
		expect(result.iteration.overallStatus).toBe('approved');
		expect(executed).toHaveLength(0);
	});

	it('surfaces tool failures as failed PlanSteps without aborting the iteration', async () => {
		const m = await createMission({
			title: 'Mixed',
			conceptMarkdown: '',
			objective: 'test',
			cadence: { kind: 'manual' },
		});

		// One call to an unknown tool (executor returns success:false) plus a stop.
		const llm = mockLlm([
			{ kind: 'tool_calls', calls: [{ name: 'does_not_exist', args: {} }] },
			{ kind: 'stop' },
		]);
		const result = await runMission(m.id, { llm });

		expect(result.plannedSteps).toBe(1);
		expect(result.failedSteps).toBe(1);
		expect(result.iteration.overallStatus).toBe('failed');
	});
});
