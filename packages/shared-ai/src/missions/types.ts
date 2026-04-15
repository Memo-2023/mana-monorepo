/**
 * AI Workbench Mission types — the stable contract shared between the
 * webapp Runner and the server-side mana-ai service.
 *
 * Mirrors `apps/mana/apps/web/src/lib/data/ai/missions/types.ts` for the
 * runtime shape; the webapp's file re-exports these and adds storage
 * concerns (Dexie table name, encryption helpers). Don't diverge without
 * a migration — both runtimes deserialize the same rows.
 */

export type MissionState = 'active' | 'paused' | 'done' | 'archived';

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

export interface MissionInputRef {
	readonly module: string;
	readonly table: string;
	readonly id: string;
}

export interface PlanStep {
	readonly id: string;
	readonly summary: string;
	readonly intent:
		| {
				readonly kind: 'toolCall';
				readonly toolName: string;
				readonly params: Record<string, unknown>;
		  }
		| { readonly kind: 'note'; readonly body: string };
	readonly proposalId?: string;
	readonly status: 'planned' | 'staged' | 'approved' | 'rejected' | 'skipped' | 'failed';
}

/**
 * Sub-state of a `running` iteration so the UI can show meaningful
 * progress instead of a spinner with no context. Set by the runner as
 * it advances; cleared when the iteration leaves `running`.
 */
export type IterationPhase =
	| 'resolving-inputs'
	| 'calling-llm'
	| 'parsing-response'
	| 'staging-proposals'
	| 'finalizing';

export interface MissionIteration {
	readonly id: string;
	readonly startedAt: string;
	readonly finishedAt?: string;
	readonly plan: readonly PlanStep[];
	readonly summary?: string;
	readonly userFeedback?: string;
	readonly overallStatus: 'running' | 'awaiting-review' | 'approved' | 'rejected' | 'failed';
	/**
	 * Where this iteration was produced.
	 *   'browser' — the foreground Runner in the user's tab (default).
	 *   'server'  — produced by the mana-ai background service;
	 *               on sync, the webapp translates PlanStep[] into local
	 *               Proposals via its staging effect.
	 * Missing/undefined is treated as 'browser' for back-compat with
	 * pre-server iterations.
	 */
	readonly source?: 'browser' | 'server';
	/** Sub-status while `overallStatus === 'running'`. Undefined otherwise. */
	readonly currentPhase?: IterationPhase;
	/** When the runner advanced into the current phase — for elapsed-in-phase. */
	readonly phaseStartedAt?: string;
	/**
	 * Human-readable detail for the current phase (e.g. "staging 2/5").
	 * Pure UI hint; not load-bearing.
	 */
	readonly phaseDetail?: string;
	/**
	 * Set to true by the user clicking "Abbrechen". The runner polls this
	 * between phases and exits early as `failed` with summary 'cancelled'.
	 */
	readonly cancelRequested?: boolean;
}

export interface Mission {
	readonly id: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	title: string;
	conceptMarkdown: string;
	objective: string;
	inputs: readonly MissionInputRef[];
	cadence: MissionCadence;
	state: MissionState;
	nextRunAt?: string;
	iterations: readonly MissionIteration[];
	userId?: string;
	deletedAt?: string;
	/**
	 * Key-Grant for server-side execution on encrypted inputs. When set,
	 * `mana-ai` can decrypt the referenced records without the user's
	 * browser tab being open. Absent or expired → server-side Runner
	 * skips the mission (state='grant-missing'), foreground Runner is
	 * unaffected. See `./grant.ts` and `docs/plans/ai-mission-key-grant.md`.
	 */
	grant?: import('./grant').MissionGrant;
}
