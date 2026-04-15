/**
 * AiPolicy — per-tool / per-module / global decision tree that the
 * AI Workbench consults before any tool call.
 *
 *   user   → always `auto` (user IS the decision)
 *   system → always `auto` (trusted subsystem)
 *   ai     → tools[name] ?? defaultsByModule[tool.module] ?? defaultForAi
 *
 * Today this type lives in shared-ai because it's a data-shape
 * concern: both the webapp and (from Phase 4 on) the mana-ai runner
 * need to read the same policy shape off an Agent record. The runtime
 * pieces — tool-registry lookup, active-policy singleton — stay in the
 * webapp.
 */

export type PolicyDecision = 'auto' | 'propose' | 'deny';

export interface AiPolicy {
	/** Tool-name → decision. Checked first. */
	readonly tools: Readonly<Record<string, PolicyDecision>>;
	/** Module-name → decision. Checked when no per-tool entry exists. */
	readonly defaultsByModule?: Readonly<Record<string, PolicyDecision>>;
	/** Global fallback when neither tool nor module has an entry. */
	readonly defaultForAi: PolicyDecision;
}
