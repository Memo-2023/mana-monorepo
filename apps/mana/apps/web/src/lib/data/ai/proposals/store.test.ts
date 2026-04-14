import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { registerTools } from '../../tools/registry';
import {
	createProposal,
	listProposals,
	approveProposal,
	rejectProposal,
	expireOldProposals,
	getProposal,
} from './store';
import { PROPOSALS_TABLE } from './types';
import type { Actor } from '../../events/actor';

const AI: Extract<Actor, { kind: 'ai' }> = {
	kind: 'ai',
	missionId: 'mission-1',
	iterationId: 'iter-1',
	rationale: 'test run',
};

let executed: { name: string; params: Record<string, unknown> }[] = [];

registerTools([
	{
		name: 'proposal_test_echo',
		module: 'proposalTest',
		description: 'Records invocation for assertions',
		parameters: [{ name: 'value', type: 'string', description: 'v', required: true }],
		async execute(params) {
			executed.push({ name: 'proposal_test_echo', params: { ...params } });
			return { success: true, message: `echo ${params.value}` };
		},
	},
]);

beforeEach(async () => {
	executed = [];
	await db.table(PROPOSALS_TABLE).clear();
});

describe('proposal lifecycle', () => {
	it('creates a pending proposal', async () => {
		const p = await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'a' } },
			rationale: 'because',
		});
		expect(p.status).toBe('pending');
		expect(p.missionId).toBe('mission-1');
		expect(p.rationale).toBe('because');
		expect(await getProposal(p.id)).toBeTruthy();
	});

	it('lists pending proposals by filter', async () => {
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'a' } },
			rationale: 'r',
		});
		await createProposal({
			actor: { ...AI, missionId: 'mission-2' },
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'b' } },
			rationale: 'r',
		});
		const all = await listProposals({ status: 'pending' });
		expect(all).toHaveLength(2);
		const m2 = await listProposals({ missionId: 'mission-2' });
		expect(m2).toHaveLength(1);
	});

	it('approving runs the intent and marks the proposal approved', async () => {
		const p = await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'go' } },
			rationale: 'r',
		});
		const { proposal, result } = await approveProposal(p.id, 'looks good');
		expect(result.success).toBe(true);
		expect(executed).toEqual([{ name: 'proposal_test_echo', params: { value: 'go' } }]);
		expect(proposal.status).toBe('approved');
		expect(proposal.userFeedback).toBe('looks good');

		const persisted = await getProposal(p.id);
		expect(persisted?.status).toBe('approved');
		expect(persisted?.decidedBy).toBe('user');
	});

	it('rejecting stores feedback and does not execute the intent', async () => {
		const p = await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'x' } },
			rationale: 'r',
		});
		await rejectProposal(p.id, 'not now');
		const persisted = await getProposal(p.id);
		expect(persisted?.status).toBe('rejected');
		expect(persisted?.userFeedback).toBe('not now');
		expect(executed).toHaveLength(0);
	});

	it('refuses to approve a non-pending proposal', async () => {
		const p = await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'x' } },
			rationale: 'r',
		});
		await rejectProposal(p.id);
		await expect(approveProposal(p.id)).rejects.toThrow(/rejected/);
	});

	it('expires proposals past their expiresAt', async () => {
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'x' } },
			rationale: 'r',
			expiresAt: '2020-01-01T00:00:00.000Z',
		});
		await createProposal({
			actor: AI,
			intent: { kind: 'toolCall', toolName: 'proposal_test_echo', params: { value: 'y' } },
			rationale: 'r',
			expiresAt: '2099-01-01T00:00:00.000Z',
		});
		const count = await expireOldProposals(new Date('2026-04-14T00:00:00.000Z'));
		expect(count).toBe(1);
		const pending = await listProposals({ status: 'pending' });
		expect(pending).toHaveLength(1);
	});
});
