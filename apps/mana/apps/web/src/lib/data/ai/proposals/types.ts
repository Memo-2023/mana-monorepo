/**
 * Proposals — staged AI intents awaiting user approval.
 *
 * When an AI-attributed tool call hits a policy of `propose`, the executor
 * records a {@link Proposal} instead of performing the underlying mutation.
 * The proposal sits in the local `pendingProposals` Dexie table until the
 * user approves it (→ run the intent), rejects it, or it auto-expires.
 *
 * Proposals are intentionally local-only — they do not sync through
 * mana-sync. The approved mutation syncs normally once executed, so
 * other devices see the resulting write without ever seeing the proposal
 * state machine.
 */

import type { Actor } from '../../events/actor';

/** Lifecycle states a proposal can be in. */
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * Structured description of what the AI wants to happen if the proposal is
 * approved. Start with `toolCall` (execute the named tool with params) and
 * extend the union with `patch` / `create` variants once module UIs need
 * to render field-level diffs inline.
 */
export type Intent = ToolCallIntent;

export interface ToolCallIntent {
	readonly kind: 'toolCall';
	readonly toolName: string;
	readonly params: Record<string, unknown>;
}

export interface Proposal {
	readonly id: string;
	readonly createdAt: string;
	readonly expiresAt?: string;
	readonly status: ProposalStatus;

	/**
	 * The AI actor that submitted this proposal. Always `kind: 'ai'` by
	 * construction — `resolvePolicy` never routes user/system writes here.
	 */
	readonly actor: Actor;
	/** Mirrors `actor.missionId` for index-based queries of "all proposals in mission X". */
	readonly missionId?: string;
	/** Mirrors `actor.iterationId`. */
	readonly iterationId?: string;
	/** The AI's stated reason for the change — surfaced in the approval UI. */
	readonly rationale: string;

	/** What runs on approve. */
	readonly intent: Intent;

	/** Set when the proposal leaves the `pending` state. */
	readonly decidedAt?: string;
	readonly decidedBy?: 'user' | 'auto-expire';
	/** Free-text feedback from the user, captured on approve or reject. */
	readonly userFeedback?: string;
}

export const PROPOSALS_TABLE = 'pendingProposals';
