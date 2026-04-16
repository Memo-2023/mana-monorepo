/**
 * Agent — named AI persona that owns a set of Missions, carries its
 * own policy + memory, and shows up as an identity in the Workbench.
 *
 * The long-form motivation + decisions are in
 * `docs/plans/multi-agent-workbench.md`. Key invariants relevant for
 * this type:
 *
 *   - `name` is display-unique per user (enforced at write time in the
 *     store, not by the DB layer — Dexie's unique indexes can't be
 *     added retroactively without a schema bump).
 *   - `systemPrompt` + `memory` are encrypted at rest (registry entry
 *     in `apps/mana/apps/web/src/lib/data/crypto/registry.ts`). The
 *     rest of the record is plaintext for search + list rendering.
 *   - `displayName` is NOT on this type — the Agent IS the display
 *     source (`name` + `avatar`). The cached `displayName` on actors
 *     is a snapshot-for-history copy that survives rename/delete.
 *   - `policy` is a value stored on the agent as of Phase 4; in
 *     Phase 2+3 it's already on the record but the runner still reads
 *     the legacy user-level policy. Having the field now avoids a
 *     second migration later.
 */

import type { AiPolicy } from '../policy/types';

export type AgentState = 'active' | 'paused' | 'archived';

export interface Agent {
	readonly id: string;
	readonly createdAt: string;
	readonly updatedAt: string;

	/** Display name, e.g. "Cashflow Watcher". Unique per user. */
	name: string;
	/** Emoji or media id. No default — UI falls back to a first-letter
	 *  avatar tile when unset. */
	avatar?: string;
	/** Short user-facing description: what is this agent for? Shown in
	 *  the agent list + picker. */
	role: string;

	/** Optional prepend to every Planner prompt for missions owned by
	 *  this agent. Encrypted at rest. */
	systemPrompt?: string;
	/** Persistent, user-curated context markdown. Injected into every
	 *  Planner prompt for missions owned by this agent. Encrypted at
	 *  rest. */
	memory?: string;

	/** Tag-based data scope — the agent sees only records tagged with at
	 *  least one of these global tags (+ untagged records). Empty array or
	 *  undefined = agent sees everything (General-Agent). IDs reference
	 *  the shared `tags` table managed by `@mana/shared-tags`. Plaintext
	 *  (tag IDs are not sensitive). */
	scopeTagIds?: string[];

	/** Per-tool allowlist/propose/deny. Replaces the user-level AiPolicy
	 *  in Phase 4; pre-populated with the default policy at create time
	 *  so the runner can start reading it even while still consulting
	 *  the legacy user-level store. */
	policy: AiPolicy;

	/** Budget — rolling 24h window, enforced by mana-ai. Undefined =
	 *  no daily budget; 0 = fully paused. */
	maxTokensPerDay?: number;
	/** Max concurrent missions the runner may execute for this agent.
	 *  Default 1 (serial). */
	maxConcurrentMissions: number;

	state: AgentState;
	deletedAt?: string;
}

/** Identifier used for the auto-created default agent on first login.
 *  Matches `LEGACY_AI_PRINCIPAL` so events emitted before the default
 *  agent was materialized remain attributable after the backfill. */
export const DEFAULT_AGENT_ID = 'legacy:ai-default';
/** Display name for the default agent. User can rename anytime. */
export const DEFAULT_AGENT_NAME = 'Mana';
