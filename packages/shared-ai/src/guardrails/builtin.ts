/**
 * Built-in guardrails — ship with the platform, always active.
 *
 * These are conservative checks that prevent obvious misuse without
 * requiring configuration. Users can't disable them (unlike per-agent
 * policy which is user-configurable).
 */

import type { PostPlanGuardrail, PreExecuteGuardrail, PrePlanGuardrail } from './types';

/** Maximum steps a planner may return in one iteration. Prevents
 *  runaway plans that would flood the proposal inbox or burn tokens. */
const MAX_PLAN_STEPS = 25;

/** Maximum resolved input size (chars) to send to the planner. Prevents
 *  accidental context-window overflow from a huge notes dump. */
const MAX_INPUT_CHARS = 100_000;

/** Tools that should never be called more than once per plan. */
const ONCE_PER_PLAN_TOOLS = new Set(['undo_drink']);

// ── Pre-Plan Guardrails ───────────────────────────────────────

export const inputSizeGuardrail: PrePlanGuardrail = {
	name: 'input-size-limit',
	phase: 'pre-plan',
	check(input) {
		let totalChars = 0;
		for (const ri of input.resolvedInputs) {
			totalChars += ri.content.length;
		}
		if (totalChars > MAX_INPUT_CHARS) {
			return {
				ok: false,
				severity: 'block',
				reason: `Resolved inputs exceed ${MAX_INPUT_CHARS} chars (${totalChars}). Reduce linked inputs.`,
			};
		}
		return { ok: true };
	},
};

// ── Post-Plan Guardrails ──────────────────────────────────────

export const planStepLimitGuardrail: PostPlanGuardrail = {
	name: 'plan-step-limit',
	phase: 'post-plan',
	check(_input, output) {
		if (output.steps.length > MAX_PLAN_STEPS) {
			return {
				ok: false,
				severity: 'block',
				reason: `Plan has ${output.steps.length} steps (max ${MAX_PLAN_STEPS}). The planner may be stuck in a loop.`,
			};
		}
		return { ok: true };
	},
};

export const duplicateToolGuardrail: PostPlanGuardrail = {
	name: 'duplicate-destructive-tool',
	phase: 'post-plan',
	check(_input, output) {
		const seen = new Map<string, number>();
		for (const step of output.steps) {
			const count = (seen.get(step.toolName) ?? 0) + 1;
			seen.set(step.toolName, count);
			if (ONCE_PER_PLAN_TOOLS.has(step.toolName) && count > 1) {
				return {
					ok: false,
					severity: 'warn',
					reason: `Tool "${step.toolName}" appears ${count} times but should only be called once per plan.`,
				};
			}
		}
		return { ok: true };
	},
};

// ── Pre-Execute Guardrails ────────────────────────────────────

export const emptyParamsGuardrail: PreExecuteGuardrail = {
	name: 'empty-required-params',
	phase: 'pre-execute',
	check(step) {
		// Flag steps where the planner returned empty strings for critical params
		if (step.toolName === 'create_task' && !step.params.title) {
			return { ok: false, severity: 'block', reason: 'create_task: title is empty' };
		}
		if (step.toolName === 'save_news_article' && !step.params.url) {
			return { ok: false, severity: 'block', reason: 'save_news_article: url is empty' };
		}
		return { ok: true };
	},
};

// ── Exports ───────────────────────────────────────────────────

export const BUILTIN_GUARDRAILS = [
	inputSizeGuardrail,
	planStepLimitGuardrail,
	duplicateToolGuardrail,
	emptyParamsGuardrail,
] as const;
