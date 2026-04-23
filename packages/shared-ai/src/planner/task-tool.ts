/**
 * LLM-facing wrapper for `runSubAgent`.
 *
 * Claude Code exposes sub-agent launching to the model as a `Task` tool
 * — the model writes `{ subagent_type, description, prompt }`, the
 * harness spins up the sub-agent and returns a single summary string as
 * the tool-result. This module provides the same surface, typed and
 * testable, ready to be plugged into any `runPlannerLoop` caller's
 * `tools` array and `onToolCall` dispatcher.
 *
 * Why this lives in shared-ai, not in `@mana/tool-registry`:
 *   - `task` is a **loop-internal control-flow tool**, not a user-data
 *     operation. It never writes to mana-sync, never carries a spaceId
 *     beyond the parent's, never appears in MCP.
 *   - Every caller of `runPlannerLoop` needs the same wiring: drop the
 *     schema into `tools`, branch `onToolCall` on `name === 'task'`,
 *     route to `taskToolHandler`. Registry would be overkill.
 *   - The `task` schema has a dynamically-filtered enum for
 *     `subagent_type` that depends on the caller's deployment — not a
 *     good fit for a static registry export.
 *
 * Telemetry: callers can read `lastRunUsage` from the factory's
 * returned context to attribute sub-agent tokens to their own budget
 * counters (mana-ai's per-agent daily cap, companion's session cost).
 */

import type { ToolSchema } from '../tools/schemas';
import { runSubAgent, MAX_SUB_AGENT_DEPTH } from './sub-agent';
import type { LlmClient, ReminderChannel, TokenUsage, ToolCallRequest, ToolResult } from './loop';
import type { SubAgentType } from './sub-agent';

/**
 * Canonical tool name. Static so consumers can `if (call.name ===
 * TASK_TOOL_NAME)` in their onToolCall branch without importing the
 * whole schema.
 */
export const TASK_TOOL_NAME = 'task';

/**
 * Default ToolSchema for the `task` tool, compatible with
 * `runPlannerLoop`'s `tools` input. `defaultPolicy` is 'auto' because
 * the LLM may legitimately call this mid-reasoning — it is NOT a
 * destructive or user-visible write, it's a control-flow primitive.
 *
 * Consumers that want to restrict which SubAgentTypes are exposable
 * can clone this schema and narrow the `enum` on `subagent_type`
 * before dropping it into their `tools` array.
 */
export const TASK_TOOL_SCHEMA: ToolSchema = {
	name: TASK_TOOL_NAME,
	module: '_agent',
	description:
		'Launch a context-isolated sub-agent to handle a focused task. ' +
		'Use this when a sub-step would add a lot of noise to the main conversation (large search, detailed investigation, long planning). ' +
		'The sub-agent runs with fresh conversation state and a restricted tool set, ' +
		'then returns a single-string summary. You do NOT see its individual tool calls. ' +
		'Cannot be called recursively — sub-agents can NOT launch further sub-agents.',
	defaultPolicy: 'auto',
	parameters: [
		{
			name: 'subagent_type',
			type: 'string',
			required: true,
			description:
				"Archetype: 'research' for read-only fact-finding, " +
				"'plan' for a thinking pass with minimal tools, " +
				"'general' for heterogeneous work including writes.",
			enum: ['research', 'plan', 'general'] as const,
		},
		{
			name: 'description',
			type: 'string',
			required: true,
			description: 'Short title for logging (≤ 80 chars). Not shown to the sub-agent.',
		},
		{
			name: 'prompt',
			type: 'string',
			required: true,
			description:
				'The actual task for the sub-agent. Be explicit about what you want in the returned summary.',
		},
	],
} as const;

/**
 * Zod-ish input validation. We stay lightweight so this module can
 * avoid a zod dependency — the loop already re-validates through the
 * tool-schema, and any parse error falls through as a tool-failure
 * that the LLM can react to.
 */
function parseTaskArgs(
	raw: unknown
): { type: SubAgentType; description: string; prompt: string } | string {
	if (!raw || typeof raw !== 'object') return 'arguments must be an object';
	const o = raw as Record<string, unknown>;
	const type = o.subagent_type;
	const description = o.description;
	const prompt = o.prompt;
	if (type !== 'research' && type !== 'plan' && type !== 'general') {
		return `subagent_type must be research|plan|general, got ${JSON.stringify(type)}`;
	}
	if (typeof description !== 'string' || description.length === 0) {
		return 'description is required';
	}
	if (typeof prompt !== 'string' || prompt.length === 0) {
		return 'prompt is required';
	}
	return { type, description, prompt };
}

export interface TaskToolHandlerOptions {
	readonly llm: LlmClient;
	/** Model the sub-agent calls through. Callers typically route this
	 *  to a cheaper tier (Haiku/flash-lite) since sub-agents are by
	 *  construction short + summarisation-heavy. */
	readonly model: string;
	/** Current recursion depth in the parent loop. Pass 0 for a
	 *  top-level call; the handler refuses at depth >= 1. */
	readonly parentDepth: number;
	/** Parent's full tool catalog. The handler filters down per
	 *  subagent_type inside `runSubAgent`. */
	readonly parentTools: readonly ToolSchema[];
	/** The parent's own tool dispatcher. Sub-agent tool calls get
	 *  routed through here — the handler wraps it so the parent's
	 *  executor, policy gate, and audit trail are reused verbatim. */
	readonly parentOnToolCall: (call: ToolCallRequest) => Promise<ToolResult>;
	/** Optional reminder channel for the sub-agent. Usually narrower
	 *  than the parent's. */
	readonly reminderChannel?: ReminderChannel;
}

export interface TaskToolHandler {
	/** The actual `onToolCall` branch. Returns a ToolResult whose
	 *  `message` is the sub-agent's summary (or the failure reason). */
	readonly handle: (call: ToolCallRequest) => Promise<ToolResult>;
	/** Rolled-up usage from every sub-agent invocation so far, so the
	 *  parent can attribute tokens to its budget. Zeros until the
	 *  first call. */
	readonly cumulativeUsage: () => TokenUsage;
	/** How many sub-agents the parent has launched so far. Useful for
	 *  metrics dashboards. */
	readonly invocationCount: () => number;
}

/**
 * Factory: bind the handler to a parent context so the consumer's
 * `onToolCall` branch can just call `handler.handle(call)` without
 * re-wiring the llm/model/tools on every call.
 */
export function createTaskToolHandler(opts: TaskToolHandlerOptions): TaskToolHandler {
	let promptTokens = 0;
	let completionTokens = 0;
	let invocations = 0;

	const handle = async (call: ToolCallRequest): Promise<ToolResult> => {
		// Defence-in-depth: the primitive throws too, but returning a
		// structured ToolResult lets the LLM see the rejection as
		// regular tool-feedback instead of bubbling up an exception.
		if (opts.parentDepth >= MAX_SUB_AGENT_DEPTH) {
			return {
				success: false,
				message:
					`Sub-Agents duerfen nicht verschachtelt werden. Parent-Depth ${opts.parentDepth} ` +
					`>= MAX_SUB_AGENT_DEPTH ${MAX_SUB_AGENT_DEPTH}. ` +
					`Fuehre die Aufgabe stattdessen im aktuellen Loop aus oder brich ab.`,
			};
		}

		const parsed = parseTaskArgs(call.arguments);
		if (typeof parsed === 'string') {
			return { success: false, message: `Invalid task args: ${parsed}` };
		}

		try {
			const result = await runSubAgent({
				llm: opts.llm,
				model: opts.model,
				type: parsed.type,
				task: parsed.prompt,
				parentTools: opts.parentTools,
				onToolCall: opts.parentOnToolCall,
				parentDepth: opts.parentDepth,
				reminderChannel: opts.reminderChannel,
			});

			promptTokens += result.usage.promptTokens;
			completionTokens += result.usage.completionTokens;
			invocations++;

			return {
				success: true,
				message: result.summary,
				data: {
					subAgentType: result.type,
					toolsCalled: result.rawResult.executedCalls.length,
					rounds: result.rawResult.rounds,
					stopReason: result.rawResult.stopReason,
					usage: result.usage,
					description: parsed.description,
				},
			};
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return { success: false, message: `Sub-agent failed: ${msg}` };
		}
	};

	return {
		handle,
		cumulativeUsage: () => ({
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
		}),
		invocationCount: () => invocations,
	};
}
