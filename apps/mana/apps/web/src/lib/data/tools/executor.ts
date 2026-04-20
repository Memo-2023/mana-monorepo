/**
 * Tool Executor — validates parameters, resolves AI policy, runs the tool.
 *
 * Policy semantics post-migration to native function-calling:
 *   - `auto` — execute directly under the actor's scope
 *   - `deny` — refuse with a ToolResult error (the runner turns this into
 *     a tool-message the LLM can react to)
 *
 * There is no proposal/approval gate in this pipeline anymore; the
 * Workbench Timeline plus per-iteration Revert is the user's review
 * surface. Tools flagged as `propose` in the catalog are treated as
 * `auto` here — the distinction only matters as legacy metadata that
 * higher layers (UI, analytics) may still read.
 */

import { getTool } from './registry';
import { runAsAsync, USER_ACTOR } from '../events/actor';
import { resolvePolicy } from '../ai/policy';
import { getAgent } from '../ai/agents/store';
import type { Actor } from '../events/actor';
import type { AiPolicy } from '@mana/shared-ai';
import type { ToolResult } from './types';

export async function executeTool(
	name: string,
	params: Record<string, unknown>,
	actor?: Actor
): Promise<ToolResult> {
	const tool = getTool(name);
	if (!tool) {
		return { success: false, message: `Unknown tool: ${name}` };
	}

	const validation = validateParams(tool.parameters, params);
	if (!validation.ok) return validation.error;

	const effectiveActor: Actor = actor ?? USER_ACTOR;

	// Agent-scoped policy: the AI actor may have a per-agent policy
	// override. If the agent record is missing (deleted / legacy /
	// race), resolvePolicy falls back to the user-level default.
	let agentPolicy: AiPolicy | undefined;
	if (effectiveActor.kind === 'ai') {
		const agent = await getAgent(effectiveActor.principalId);
		agentPolicy = agent?.policy;
	}
	const decision = resolvePolicy(name, effectiveActor, agentPolicy);

	if (decision === 'deny') {
		return {
			success: false,
			message: `Tool "${name}" is not available to AI actors under current policy`,
		};
	}

	// `auto` or `propose` both execute here — see file-level comment.
	return runAsAsync(effectiveActor, () => runValidatedTool(tool, params));
}

/**
 * Run a tool bypassing AI policy. Used by the proposal approval path, which
 * already has user consent and must not bounce back into another proposal.
 *
 * Caller is responsible for installing the right actor via `runAsAsync`.
 */
export async function executeToolRaw(
	name: string,
	params: Record<string, unknown>
): Promise<ToolResult> {
	const tool = getTool(name);
	if (!tool) return { success: false, message: `Unknown tool: ${name}` };
	const validation = validateParams(tool.parameters, params);
	if (!validation.ok) return validation.error;
	return runValidatedTool(tool, params);
}

// ── Internals ───────────────────────────────────────────────

async function runValidatedTool(
	tool: { execute: (p: Record<string, unknown>) => Promise<ToolResult> },
	params: Record<string, unknown>
): Promise<ToolResult> {
	try {
		return await tool.execute(params);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, message: `Tool execution failed: ${msg}` };
	}
}

type ValidationOutcome = { ok: true } | { ok: false; error: ToolResult };

function validateParams(
	schema: { name: string; type: string; required: boolean; enum?: string[] }[],
	params: Record<string, unknown>
): ValidationOutcome {
	for (const p of schema) {
		if (p.required && (params[p.name] === undefined || params[p.name] === null)) {
			return {
				ok: false,
				error: { success: false, message: `Missing required parameter: ${p.name}` },
			};
		}
	}
	for (const p of schema) {
		const val = params[p.name];
		if (val === undefined || val === null) continue;

		if (p.type === 'number' && typeof val !== 'number') {
			const num = Number(val);
			if (isNaN(num)) {
				return {
					ok: false,
					error: { success: false, message: `Parameter ${p.name} must be a number` },
				};
			}
			params[p.name] = num;
		}
		if (p.type === 'boolean' && typeof val !== 'boolean') {
			params[p.name] = val === 'true' || val === true;
		}
		if (p.enum && !p.enum.includes(String(val))) {
			return {
				ok: false,
				error: {
					success: false,
					message: `Parameter ${p.name} must be one of: ${p.enum.join(', ')}`,
				},
			};
		}
	}
	return { ok: true };
}
