/**
 * Missions — long-lived AI work items.
 *
 * A Mission is the user's standing instruction to the AI ("review my goals
 * every Monday and propose three concrete actions"). The AI plans, stages
 * proposals (via `pendingProposals`), collects feedback, and iterates.
 *
 * This file is data-model only. The Planner and Runner live elsewhere and
 * operate on Missions — see `COMPANION_BRAIN_ARCHITECTURE.md §20` for the
 * full pipeline.
 *
 * Missions sync (unlike proposals) — they are long-lived user-authored
 * artifacts and should be available cross-device. Sensitive user-typed
 * text (conceptMarkdown, objective, rationale strings in iterations) is
 * encryption-eligible; IDs, timestamps, state enums stay plaintext.
 */

import type { ProposalStatus } from '../proposals/types';

/** Lifecycle of a Mission. */
export type MissionState = 'active' | 'paused' | 'done' | 'archived';

/** How often the Runner should pick this Mission up. */
export type MissionCadence =
	| { readonly kind: 'manual' }
	| { readonly kind: 'interval'; readonly everyMinutes: number }
	| { readonly kind: 'daily'; readonly atHour: number; readonly atMinute: number }
	| {
			readonly kind: 'weekly';
			readonly dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
			readonly atHour: number;
	  }
	| { readonly kind: 'cron'; readonly expression: string };

/** Reference to a record in another module this Mission draws context from. */
export interface MissionInputRef {
	/** Source module — e.g. `'notes'`, `'goals'`, `'kontext'`. */
	readonly module: string;
	/** Dexie table name (needed because some modules have multiple). */
	readonly table: string;
	/** Record id. */
	readonly id: string;
}

/** A single step the Planner proposed for the current iteration. */
export interface PlanStep {
	readonly id: string;
	/** Human-readable summary shown in the Workbench. */
	readonly summary: string;
	/** What runs — today only toolCalls; later: sub-missions, text-generation, etc. */
	readonly intent:
		| {
				readonly kind: 'toolCall';
				readonly toolName: string;
				readonly params: Record<string, unknown>;
		  }
		| { readonly kind: 'note'; readonly body: string };
	/** Proposal id if this step was staged; undefined before execution. */
	readonly proposalId?: string;
	/** Outcome of this step. */
	readonly status: 'planned' | 'staged' | 'approved' | 'rejected' | 'skipped' | 'failed';
}

/** One autonomous run of the Mission, produced by the Runner invoking the Planner. */
export interface MissionIteration {
	readonly id: string;
	readonly startedAt: string;
	readonly finishedAt?: string;
	/** Plan the Planner generated this run. */
	readonly plan: readonly PlanStep[];
	/** AI's own notes on what it did and why (for the next iteration's context). */
	readonly summary?: string;
	/** Free-text feedback the user attached on review. */
	readonly userFeedback?: string;
	/** Shortcut derived from step proposal statuses — used by queries / UI. */
	readonly overallStatus: 'running' | 'awaiting-review' | 'approved' | 'rejected' | 'failed';
}

export interface Mission {
	readonly id: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	/** Short user-facing name. */
	title: string;
	/** Markdown doc describing the concept / rules of engagement. */
	conceptMarkdown: string;
	/** One-sentence concrete objective. */
	objective: string;
	/** Module records this Mission reads from for context. */
	inputs: readonly MissionInputRef[];
	/** Cadence the Runner honours. */
	cadence: MissionCadence;
	/** Lifecycle. */
	state: MissionState;
	/** ISO timestamp of the next scheduled run, or undefined if not scheduled. */
	nextRunAt?: string;
	/** All past iterations, newest last. */
	iterations: readonly MissionIteration[];

	// ── Bookkeeping ──────────────────────────
	userId?: string;
	deletedAt?: string;
}

export const MISSIONS_TABLE = 'aiMissions';

/** Helper — derive a summary status for a proposal-id lookup. */
export function planStepStatusFromProposal(status: ProposalStatus): PlanStep['status'] {
	switch (status) {
		case 'pending':
			return 'staged';
		case 'approved':
			return 'approved';
		case 'rejected':
			return 'rejected';
		case 'expired':
			return 'skipped';
	}
}
