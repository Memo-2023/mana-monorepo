/**
 * Planner contract — shared input / output shape used by prompt builder,
 * parser, and the `aiPlanTask` LLM wrapper.
 */

import type { Mission } from '../types';

/** Resolved content for one {@link MissionInputRef}. */
export interface ResolvedInput {
	readonly id: string;
	readonly module: string;
	readonly table: string;
	readonly title?: string;
	readonly content: string;
}

/** Tool definition the Planner is allowed to propose. */
export interface AvailableTool {
	readonly name: string;
	readonly module: string;
	readonly description: string;
	readonly parameters: ReadonlyArray<{
		readonly name: string;
		readonly type: string;
		readonly required: boolean;
		readonly description: string;
		readonly enum?: readonly string[];
	}>;
}

export interface AiPlanInput {
	readonly mission: Mission;
	/** Content of every MissionInputRef, pre-fetched by the caller (Runner). */
	readonly resolvedInputs: readonly ResolvedInput[];
	/** Tools the policy has whitelisted for AI proposals in this run. */
	readonly availableTools: readonly AvailableTool[];
}

/**
 * One step in the Planner's output. The Runner turns each step into a
 * Proposal by calling `executeTool(toolName, params, aiActor)` — the
 * policy routes it to `propose`, and the Proposal carries the rationale.
 */
export interface PlannedStep {
	readonly summary: string;
	readonly toolName: string;
	readonly params: Record<string, unknown>;
	readonly rationale: string;
}

export interface AiPlanOutput {
	/** 1–N steps the AI wants to take this iteration. May be empty (no-op run). */
	readonly steps: readonly PlannedStep[];
	/** The AI's one-line summary of the plan, stored on `MissionIteration.summary`. */
	readonly summary: string;
}
