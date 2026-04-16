/**
 * Guardrail types — pre/post-execution checks for the AI Mission Runner.
 *
 * Guardrails run alongside the planning and execution pipeline to validate
 * inputs, outputs, and tool calls. They can:
 *   - Block a planner call (pre-plan: input too sensitive, budget exceeded)
 *   - Reject a plan (post-plan: too many steps, unknown patterns)
 *   - Block a tool call (pre-execute: destructive op, rate limit)
 *   - Flag a result (post-execute: suspicious output)
 *
 * Guardrails are synchronous checks, not AI calls. They run fast and never
 * hit the network. The Runner calls them inline and either proceeds or
 * aborts based on the result.
 */

import type { AiPlanInput, AiPlanOutput, PlannedStep } from '../planner/types';

export type GuardrailPhase = 'pre-plan' | 'post-plan' | 'pre-execute' | 'post-execute';

export interface GuardrailResult {
	/** Whether the guardrail passed. */
	readonly ok: boolean;
	/** Human-readable reason if blocked. Shown in the iteration error. */
	readonly reason?: string;
	/** Optional severity: 'warn' logs but doesn't block, 'block' aborts. */
	readonly severity?: 'warn' | 'block';
}

export interface PrePlanGuardrail {
	readonly name: string;
	readonly phase: 'pre-plan';
	check(input: AiPlanInput): GuardrailResult;
}

export interface PostPlanGuardrail {
	readonly name: string;
	readonly phase: 'post-plan';
	check(input: AiPlanInput, output: AiPlanOutput): GuardrailResult;
}

export interface PreExecuteGuardrail {
	readonly name: string;
	readonly phase: 'pre-execute';
	check(step: PlannedStep): GuardrailResult;
}

export interface PostExecuteGuardrail {
	readonly name: string;
	readonly phase: 'post-execute';
	check(step: PlannedStep, result: { success: boolean; data?: unknown }): GuardrailResult;
}

export type Guardrail =
	| PrePlanGuardrail
	| PostPlanGuardrail
	| PreExecuteGuardrail
	| PostExecuteGuardrail;
