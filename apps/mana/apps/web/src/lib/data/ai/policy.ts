/**
 * AI policy — per-tool decision of what an AI-attributed call should do.
 *
 *   `auto`    — execute immediately with the `ai` actor propagated into the
 *               write path. Use for read-only queries and append-only
 *               self-state logs where the AI can't do damage.
 *   `propose` — record a {@link Proposal} in the `pendingProposals` table
 *               instead of executing. User reviews + approves in the module
 *               UI, which then runs the stored intent.
 *   `deny`    — refuse the call outright. Use for destructive operations
 *               the AI must never touch (e.g. account deletion).
 *
 * Policy applies only when the caller is an `ai` actor. `user` writes always
 * bypass this layer (they ARE the approval). `system` writes (projections,
 * rules, migrations) also bypass — they are trusted-by-subsystem.
 *
 * The default config below is deliberately conservative: anything that
 * mutates a user-visible record defaults to `propose`. Loosen per-tool as
 * the UX matures and trust is earned.
 */

import { getTool } from '../tools/registry';
import type { Actor } from '../events/actor';
import { AI_PROPOSABLE_TOOL_NAMES } from '@mana/shared-ai';

export type PolicyDecision = 'auto' | 'propose' | 'deny';

export interface AiPolicy {
	/** Tool-name → decision. Checked first. */
	readonly tools: Readonly<Record<string, PolicyDecision>>;
	/** Module-name → decision. Checked when no per-tool entry exists. */
	readonly defaultsByModule?: Readonly<Record<string, PolicyDecision>>;
	/** Global fallback when neither tool nor module has an entry. */
	readonly defaultForAi: PolicyDecision;
}

// ── Auto-executed tools (read-only / append-only self-state) ──────────
// Kept here as the canonical local-only list — policies that don't mutate
// user-visible records are webapp-specific and don't need to travel
// through @mana/shared-ai.
const AUTO_TOOLS: Record<string, 'auto'> = {
	get_task_stats: 'auto',
	list_tasks: 'auto',
	get_todays_events: 'auto',
	get_drink_progress: 'auto',
	nutrition_summary: 'auto',
	get_places: 'auto',
	location_log: 'auto',
	// Append-only self-state logs: AI proposing "did you drink water?" +
	// user confirming + AI logging it should not require a second approval.
	log_drink: 'auto',
	log_meal: 'auto',
};

// ── Proposable tools derived from the shared canonical list ───────────
// Keeps the webapp policy and mana-ai's `AI_AVAILABLE_TOOLS` from drifting.
// Adding a new proposable tool → append to AI_PROPOSABLE_TOOL_NAMES in
// @mana/shared-ai and both sides pick it up automatically.
const PROPOSE_TOOLS: Record<string, 'propose'> = Object.fromEntries(
	AI_PROPOSABLE_TOOL_NAMES.map((name) => [name, 'propose'] as const)
);

export const DEFAULT_AI_POLICY: AiPolicy = {
	tools: { ...AUTO_TOOLS, ...PROPOSE_TOOLS },
	defaultForAi: 'propose',
};

let activePolicy: AiPolicy = DEFAULT_AI_POLICY;

/** Test / settings hook — replace the active policy. Returns a restorer. */
export function setAiPolicy(policy: AiPolicy): () => void {
	const previous = activePolicy;
	activePolicy = policy;
	return () => {
		activePolicy = previous;
	};
}

export function getAiPolicy(): AiPolicy {
	return activePolicy;
}

/**
 * Resolve the policy decision for a tool invocation by a given actor.
 *
 *   user   → always `auto` (user IS the decision)
 *   system → always `auto` (trusted subsystem)
 *   ai     → tools[name] ?? defaultsByModule[tool.module] ?? defaultForAi
 */
export function resolvePolicy(
	toolName: string,
	actor: Actor,
	policy: AiPolicy = activePolicy
): PolicyDecision {
	if (actor.kind !== 'ai') return 'auto';

	const byTool = policy.tools[toolName];
	if (byTool) return byTool;

	const moduleDefaults = policy.defaultsByModule;
	if (moduleDefaults) {
		const tool = getTool(toolName);
		if (tool && moduleDefaults[tool.module]) return moduleDefaults[tool.module];
	}

	return policy.defaultForAi;
}
