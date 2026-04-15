/**
 * Tool Executor — validates parameters, resolves AI policy, and runs or
 * stages the tool by name.
 *
 * Call paths:
 *   - User action from the UI: `executeTool(name, params)` with no actor
 *     → ambient `USER_ACTOR`, policy returns `auto`, tool runs directly.
 *   - AI in the companion orchestrator: `executeTool(name, params, aiActor)`
 *     → policy resolves per-tool; `propose` writes a Proposal and returns
 *       a success result carrying the proposal id, `auto` executes, `deny`
 *       refuses.
 *   - Approval path: proposal store calls `executeToolRaw(name, params)`
 *     under `runAsAsync(aiActor, ...)` — same validation, but no policy.
 */

import { getTool } from './registry';
import { runAsAsync, USER_ACTOR } from '../events/actor';
import { resolvePolicy } from '../ai/policy';
import { createProposal } from '../ai/proposals/store';
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

	// Multi-Agent Workbench (Phase 4): policy lives on the agent. When
	// the actor is AI, look up the owning agent and use its policy. If
	// the agent record is missing (legacy write, deleted agent, race),
	// resolvePolicy falls back to the user-level DEFAULT_AI_POLICY via
	// its optional-argument default.
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

	if (decision === 'propose') {
		// Only ai actors can hit `propose` — resolvePolicy short-circuits
		// user/system to `auto`. Narrow defensively in case policy is swapped.
		if (effectiveActor.kind !== 'ai') {
			return { success: false, message: `propose policy requires an AI actor` };
		}
		const proposal = await createProposal({
			actor: effectiveActor,
			intent: { kind: 'toolCall', toolName: name, params },
			rationale: effectiveActor.rationale,
		});
		return {
			success: true,
			data: { proposalId: proposal.id, status: 'pending' },
			message: `Vorgeschlagen: "${name}" wartet auf Freigabe.`,
		};
	}

	// decision === 'auto'
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
