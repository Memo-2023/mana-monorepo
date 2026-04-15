import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { registerTools } from '../../tools/registry';
import { createProposal } from './store';
import { PROPOSALS_TABLE } from './types';
import { makeAgentActor, LEGACY_AI_PRINCIPAL, type AiActor } from '../../events/actor';

// Register two tools in distinct modules so the `module` filter has
// something to discriminate against.
registerTools([
	{
		name: 'queries_test_todo_op',
		module: 'todo',
		description: 'd',
		parameters: [],
		async execute() {
			return { success: true, message: 'ok' };
		},
	},
	{
		name: 'queries_test_calendar_op',
		module: 'calendar',
		description: 'd',
		parameters: [],
		async execute() {
			return { success: true, message: 'ok' };
		},
	},
]);

const AI: AiActor = makeAgentActor({
	agentId: LEGACY_AI_PRINCIPAL,
	displayName: 'Mana',
	missionId: 'm-a',
	iterationId: 'i-a',
	rationale: 'r',
});

beforeEach(async () => {
	await db.table(PROPOSALS_TABLE).clear();
});

describe('proposal filters (logic used by useAiProposals)', () => {
	it('filters by module via the tool registry lookup', async () => {
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'queries_test_todo_op', params: {} },
			rationale: 'r',
		});
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'queries_test_calendar_op', params: {} },
			rationale: 'r',
		});

		// Replicate the filter logic used inside the live query
		const { getTool } = await import('../../tools/registry');
		const all = await db.table(PROPOSALS_TABLE).toArray();
		const todoOnly = all.filter((p) => {
			if (p.intent.kind !== 'toolCall') return false;
			const tool = getTool(p.intent.toolName);
			return tool?.module === 'todo';
		});
		expect(todoOnly).toHaveLength(1);
		expect(todoOnly[0].intent.toolName).toBe('queries_test_todo_op');
	});

	it('filters by missionId', async () => {
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'queries_test_todo_op', params: {} },
			rationale: 'r',
		});
		await createProposal({
			actor: { ...AI, missionId: 'm-b' },
			intent: { kind: 'toolCall', toolName: 'queries_test_todo_op', params: {} },
			rationale: 'r',
		});

		const all = await db.table(PROPOSALS_TABLE).toArray();
		const onlyA = all.filter((p) => p.missionId === 'm-a');
		expect(onlyA).toHaveLength(1);
	});
});
