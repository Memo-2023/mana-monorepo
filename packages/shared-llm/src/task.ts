/**
 * The LlmTask contract — the unit of work modules describe to the
 * orchestrator. Tasks bundle:
 *
 *   1. The LLM-side implementation (used for browser/server/cloud tiers)
 *   2. An optional rules-tier fallback (used when the LLM tier is
 *      unavailable, fails, or the user has opted out of all LLM tiers)
 *   3. Routing metadata (minimum tier, content class, capability needs)
 *
 * Tasks live next to the modules that use them — there is intentionally
 * no central task registry. The convention is:
 *
 *   apps/mana/apps/web/src/lib/llm-tasks/   ← cross-module helpers
 *   apps/mana/apps/web/src/lib/modules/notes/llm-tasks/   ← notes-specific
 *
 * The orchestrator never imports tasks directly — modules import tasks
 * AND the orchestrator and call `orchestrator.run(task, input)`.
 */

import type { LlmTier } from './tiers';
import type { ContentClass, CapabilityRequirements, LlmBackend, LlmTaskRequest } from './types';

export interface LlmTask<TInput, TOutput> {
	/**
	 * Stable identifier for this task. Used for telemetry, per-task
	 * tier overrides in user settings, and debug logs. Convention is
	 * `{module}.{action}` — e.g. `notes.extractTags`, `todo.parseQuickAdd`.
	 */
	readonly name: string;

	/** Lowest tier this task can produce a useful result on. */
	readonly minTier: LlmTier;

	/** Privacy class of inputs this task handles. */
	readonly contentClass: ContentClass;

	/** Capability requirements that exclude tiers/backends that can't satisfy them. */
	readonly requires?: CapabilityRequirements;

	/**
	 * User-facing label, shown when telling the user "this task needs
	 * AI" or "this result was computed via tier X".
	 */
	readonly displayLabel: string;

	/**
	 * The LLM-based implementation. Builds an LlmTaskRequest from the
	 * task input and asks the backend to run it, then maps the
	 * generated text back into the typed TOutput shape (e.g. parses
	 * JSON, validates a date, looks up a tag).
	 */
	runLlm(input: TInput, backend: LlmBackend): Promise<TOutput>;

	/**
	 * Optional deterministic fallback — runs when no LLM tier is
	 * available, or when the LLM tier failed and
	 * `fallbackToRulesOnError` is enabled in user settings.
	 *
	 * Returning the typed TOutput indicates success. Throwing means
	 * the rules implementation also can't handle this input — the
	 * orchestrator will then surface a NoTierAvailableError so the
	 * UI can ask the user for direct input.
	 */
	runRules?(input: TInput): Promise<TOutput>;
}

/**
 * Helper for tasks that need to construct an LlmTaskRequest from their
 * own input. Centralizes the boilerplate so individual tasks don't have
 * to redeclare taskName / contentClass / requires every time.
 */
export function buildTaskRequest<TInput, TOutput>(
	task: LlmTask<TInput, TOutput>,
	overrides: Omit<LlmTaskRequest, 'taskName' | 'contentClass' | 'requires'>
): LlmTaskRequest {
	return {
		...overrides,
		taskName: task.name,
		contentClass: task.contentClass,
		requires: task.requires,
	};
}
