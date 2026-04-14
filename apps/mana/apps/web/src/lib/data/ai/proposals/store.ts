/**
 * Proposal store — create, list, approve, reject, expire.
 *
 * Approval re-runs the tool the AI originally called, but this time forces
 * the executor into `auto` mode so the stored intent can't bounce back into
 * another proposal. Rejection just marks the row — the AI sees the feedback
 * on the next planner pass via `listProposals({ status: 'rejected' })`.
 */

import { db } from '../../database';
import { runAsAsync } from '../../events/actor';
import type { Actor } from '../../events/actor';
import type { ToolResult } from '../../tools/types';
import type { Intent, Proposal, ProposalStatus } from './types';
import { PROPOSALS_TABLE } from './types';

const table = () => db.table<Proposal>(PROPOSALS_TABLE);

export interface CreateProposalInput {
	actor: Extract<Actor, { kind: 'ai' }>;
	intent: Intent;
	rationale: string;
	/** ISO timestamp. Falsy → no auto-expiry. */
	expiresAt?: string;
}

export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
	const proposal: Proposal = {
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
		expiresAt: input.expiresAt,
		status: 'pending',
		actor: input.actor,
		missionId: input.actor.missionId,
		iterationId: input.actor.iterationId,
		rationale: input.rationale,
		intent: input.intent,
	};
	await table().add(proposal);
	return proposal;
}

export async function getProposal(id: string): Promise<Proposal | undefined> {
	return table().get(id);
}

export interface ListProposalsFilter {
	status?: ProposalStatus;
	missionId?: string;
}

export async function listProposals(filter: ListProposalsFilter = {}): Promise<Proposal[]> {
	let coll = table().orderBy('createdAt').reverse();
	if (filter.status) coll = coll.filter((p) => p.status === filter.status);
	if (filter.missionId) coll = coll.filter((p) => p.missionId === filter.missionId);
	return coll.toArray();
}

/**
 * Approve a pending proposal. Runs the stored intent with the AI actor
 * re-installed so downstream events and records carry the original
 * mission/iteration attribution — critical for the Workbench timeline.
 *
 * The executor is forced into `auto` by construction: the approved
 * `executeTool` call re-reads policy, which would again say `propose` —
 * so we bypass policy by calling the tool implementation directly under
 * the `ai` actor instead of routing through the policy-gated executor.
 */
export async function approveProposal(
	id: string,
	userFeedback?: string
): Promise<{ proposal: Proposal; result: ToolResult }> {
	const proposal = await getProposal(id);
	if (!proposal) throw new Error(`Proposal not found: ${id}`);
	if (proposal.status !== 'pending') {
		throw new Error(`Proposal ${id} is ${proposal.status}, cannot approve`);
	}

	const result = await runApprovedIntent(proposal);

	const updated: Partial<Proposal> = {
		status: 'approved',
		decidedAt: new Date().toISOString(),
		decidedBy: 'user',
		userFeedback,
	};
	await table().update(id, updated);
	return { proposal: { ...proposal, ...updated }, result };
}

export async function rejectProposal(id: string, userFeedback?: string): Promise<Proposal> {
	const proposal = await getProposal(id);
	if (!proposal) throw new Error(`Proposal not found: ${id}`);
	if (proposal.status !== 'pending') {
		throw new Error(`Proposal ${id} is ${proposal.status}, cannot reject`);
	}
	const updated: Partial<Proposal> = {
		status: 'rejected',
		decidedAt: new Date().toISOString(),
		decidedBy: 'user',
		userFeedback,
	};
	await table().update(id, updated);
	return { ...proposal, ...updated };
}

/**
 * Mark any pending proposal whose `expiresAt` has passed as expired. Fire
 * this from a low-frequency tick (e.g. on app focus); cheap, indexed scan.
 */
export async function expireOldProposals(now: Date = new Date()): Promise<number> {
	const cutoff = now.toISOString();
	const stale = await table()
		.where('status')
		.equals('pending')
		.filter((p) => typeof p.expiresAt === 'string' && p.expiresAt < cutoff)
		.toArray();

	for (const p of stale) {
		await table().update(p.id, {
			status: 'expired',
			decidedAt: cutoff,
			decidedBy: 'auto-expire',
		});
	}
	return stale.length;
}

/**
 * Run the intent under the original AI actor, bypassing policy. The user
 * has consented via approval; re-entering the policy gate would bounce the
 * call straight back into a new proposal.
 *
 * The `executor` import is lazy: `tools/executor.ts` imports this file's
 * `createProposal`, so a top-level import here would form a cycle.
 */
async function runApprovedIntent(proposal: Proposal): Promise<ToolResult> {
	return runAsAsync(proposal.actor, async () => {
		if (proposal.intent.kind === 'toolCall') {
			const { executeToolRaw } = await import('../../tools/executor');
			return executeToolRaw(proposal.intent.toolName, proposal.intent.params);
		}
		throw new Error(`Unsupported intent kind: ${(proposal.intent as { kind: string }).kind}`);
	});
}
