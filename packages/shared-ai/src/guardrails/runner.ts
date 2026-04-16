/**
 * Guardrail runner — executes guardrails for each pipeline phase.
 *
 * Returns the first blocking result (severity='block') or collects
 * warnings. The Mission Runner calls these at the appropriate points
 * in the pipeline and decides how to handle failures.
 */

import type { AiPlanInput, AiPlanOutput, PlannedStep } from '../planner/types';
import type {
	Guardrail,
	GuardrailResult,
	PrePlanGuardrail,
	PostPlanGuardrail,
	PreExecuteGuardrail,
} from './types';
import { BUILTIN_GUARDRAILS } from './builtin';

function isPhase<T extends Guardrail>(phase: string, g: Guardrail): g is T {
	return g.phase === phase;
}

const prePlan = BUILTIN_GUARDRAILS.filter((g): g is PrePlanGuardrail => isPhase('pre-plan', g));
const postPlan = BUILTIN_GUARDRAILS.filter((g): g is PostPlanGuardrail => isPhase('post-plan', g));
const preExecute = BUILTIN_GUARDRAILS.filter((g): g is PreExecuteGuardrail =>
	isPhase('pre-execute', g)
);

export interface GuardrailCheckResult {
	/** True if all guardrails passed (or only warned). */
	readonly passed: boolean;
	/** Blocking reason (first 'block' severity failure). */
	readonly blockReason?: string;
	/** Names of guardrails that triggered (warn or block). */
	readonly triggered: string[];
}

function run(results: Array<{ name: string; result: GuardrailResult }>): GuardrailCheckResult {
	const triggered: string[] = [];
	for (const { name, result } of results) {
		if (!result.ok) {
			triggered.push(name);
			if (result.severity === 'block' || result.severity === undefined) {
				return { passed: false, blockReason: result.reason ?? name, triggered };
			}
		}
	}
	return { passed: true, triggered };
}

/** Run pre-plan guardrails. Call before the Planner LLM call. */
export function runPrePlanGuardrails(input: AiPlanInput): GuardrailCheckResult {
	return run(prePlan.map((g) => ({ name: g.name, result: g.check(input) })));
}

/** Run post-plan guardrails. Call after parsing the Planner response. */
export function runPostPlanGuardrails(
	input: AiPlanInput,
	output: AiPlanOutput
): GuardrailCheckResult {
	return run(postPlan.map((g) => ({ name: g.name, result: g.check(input, output) })));
}

/** Run pre-execute guardrails. Call before each tool execution. */
export function runPreExecuteGuardrails(step: PlannedStep): GuardrailCheckResult {
	return run(preExecute.map((g) => ({ name: g.name, result: g.check(step) })));
}
