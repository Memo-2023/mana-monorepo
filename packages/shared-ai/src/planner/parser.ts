/**
 * Parser for Planner LLM output.
 *
 * Strict: we only accept the fenced `json` block the system prompt
 * prescribes, validate shape, and surface errors so the Runner can
 * record them on the iteration instead of silently producing a bad plan.
 */

import type { AiPlanOutput, PlannedStep } from './types';

export type ParseResult =
	| { readonly ok: true; readonly value: AiPlanOutput }
	| { readonly ok: false; readonly reason: string; readonly raw?: string };

export function parsePlannerResponse(text: string, knownToolNames: Set<string>): ParseResult {
	const block = extractJsonBlock(text);
	if (!block) return { ok: false, reason: 'no JSON block found', raw: text };

	let parsed: unknown;
	try {
		parsed = JSON.parse(block);
	} catch (err) {
		return {
			ok: false,
			reason: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
			raw: block,
		};
	}

	if (typeof parsed !== 'object' || parsed === null) {
		return { ok: false, reason: 'top-level value is not an object', raw: block };
	}

	const obj = parsed as Record<string, unknown>;
	const summary = typeof obj.summary === 'string' ? obj.summary : '';
	const rawSteps = obj.steps;
	if (!Array.isArray(rawSteps)) {
		return { ok: false, reason: '`steps` must be an array', raw: block };
	}

	const steps: PlannedStep[] = [];
	for (let i = 0; i < rawSteps.length; i++) {
		const step = rawSteps[i];
		const validation = validateStep(step, knownToolNames, i);
		if (!validation.ok) {
			return { ok: false, reason: validation.reason, raw: block };
		}
		steps.push(validation.value);
	}

	return { ok: true, value: { summary, steps } };
}

function extractJsonBlock(text: string): string | null {
	const fenced = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;
	const m = text.match(fenced);
	if (m) return m[1].trim();
	const trimmed = text.trim();
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
	return null;
}

function validateStep(
	raw: unknown,
	knownToolNames: Set<string>,
	index: number
): { ok: true; value: PlannedStep } | { ok: false; reason: string } {
	if (typeof raw !== 'object' || raw === null) {
		return { ok: false, reason: `step[${index}] is not an object` };
	}
	const obj = raw as Record<string, unknown>;
	const toolName = obj.toolName;
	if (typeof toolName !== 'string' || toolName.length === 0) {
		return { ok: false, reason: `step[${index}].toolName missing or not a string` };
	}
	if (!knownToolNames.has(toolName)) {
		return {
			ok: false,
			reason: `step[${index}].toolName "${toolName}" is not in the allowed tool set`,
		};
	}
	const summary = typeof obj.summary === 'string' ? obj.summary : '';
	const rationale = typeof obj.rationale === 'string' ? obj.rationale : '';
	if (rationale.length === 0) {
		return { ok: false, reason: `step[${index}].rationale is required (user will see this)` };
	}
	const params =
		typeof obj.params === 'object' && obj.params !== null
			? (obj.params as Record<string, unknown>)
			: {};

	return {
		ok: true,
		value: { summary, toolName, rationale, params },
	};
}
