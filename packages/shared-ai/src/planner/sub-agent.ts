/**
 * In-process sub-agent loop — the `I2A` pattern from Claude Code.
 *
 * A sub-agent is `runPlannerLoop` run with four invariants flipped:
 *
 *   1. FRESH `messages[]` — the parent's history never leaks into the
 *      sub-agent. The sub-agent only sees its own system prompt + task
 *      description. This is the "context-laundering" point: hundreds
 *      of scanned files, retry loops, or noisy tool results stay
 *      inside the sub-agent and never pollute the parent log.
 *
 *   2. RESTRICTED tool-whitelist — the parent's full tool-set is
 *      filtered down to a subset appropriate for the sub-agent's type
 *      (e.g. `research` gets read-only tools, `general` gets whatever
 *      the parent had). The whitelist is enforced at THIS layer, not
 *      left to the LLM to "please don't use write tools".
 *
 *   3. SINGLE RETURN VALUE — the sub-agent loop produces one string
 *      summary back to the parent (rendered as the parent's `task`
 *      tool-result). The parent NEVER sees the sub-agent's individual
 *      tool calls. This is the Claude-Code contract and matches the
 *      original paper's sub-episode recipe from RL.
 *
 *   4. ONE LEVEL DEEP, STRICT — a sub-agent cannot launch another
 *      sub-agent. `parentDepth` in the input enforces this; the
 *      consumer-level `task` tool handler is the other guard.
 *
 * Token usage from the sub-agent rolls up to the caller (returned as
 * part of `SubAgentResult.usage`) so budget tracking in mana-ai's
 * agent snapshots sees the full sub-tree cost, not just the parent loop.
 */

import type { ToolSchema } from '../tools/schemas';
import { runPlannerLoop } from './loop';
import type {
	LlmClient,
	PlannerLoopResult,
	ReminderChannel,
	TokenUsage,
	ToolCallRequest,
	ToolResult,
} from './loop';

/**
 * Named sub-agent archetypes. Each type declares a default tool-filter
 * predicate that the launcher uses to carve the allowed tool-set out of
 * the parent's full catalog.
 *
 *   - `research`: read-only. LLM may list/get/search but not mutate.
 *                 Default for "go scan these things and tell me what's
 *                 there" tasks. Matches Claude Code's `Explore` agent.
 *
 *   - `general`:  anything the parent could do (minus recursion). For
 *                 heterogeneous tasks where the sub-agent may need
 *                 writes. Equivalent to Claude Code's `general-purpose`.
 *
 *   - `plan`:     read-only, small round budget. For "think through
 *                 this before acting" where the summary IS the value.
 *                 Matches Claude Code's `Plan` mode.
 *
 * Consumers can supply a custom `toolFilter` to override these defaults.
 */
export type SubAgentType = 'research' | 'general' | 'plan';

const DEFAULT_TOOL_FILTERS: Record<SubAgentType, (tool: ToolSchema) => boolean> = {
	research: (t) => t.defaultPolicy === 'auto',
	general: () => true,
	plan: (t) => t.defaultPolicy === 'auto',
};

const DEFAULT_MAX_ROUNDS: Record<SubAgentType, number> = {
	research: 5,
	general: 5,
	plan: 3,
};

/**
 * Hard cap on recursion — one level deep, period. Matches Claude Code's
 * `KN5` launcher behaviour.
 */
export const MAX_SUB_AGENT_DEPTH = 1;

export interface RunSubAgentInput {
	/** LLM transport. Typically the same client as the parent; can be
	 *  swapped for a cheaper-tier model for research-type sub-agents. */
	readonly llm: LlmClient;
	/** Model id — in `provider/model` form. If omitted, the sub-agent
	 *  falls back to the parent-supplied `model`. */
	readonly model?: string;
	/** Archetype — see `SubAgentType` docs. */
	readonly type: SubAgentType;
	/** Free-text task description the parent wants the sub-agent to
	 *  execute. Becomes the sub-agent's `userPrompt`. */
	readonly task: string;
	/** Parent's full tool catalog. The launcher applies the type's
	 *  filter (or the caller's override) to produce the sub-agent's
	 *  restricted set. */
	readonly parentTools: readonly ToolSchema[];
	/** Optional tool-filter override. Takes precedence over the
	 *  type's default predicate. */
	readonly toolFilter?: (tool: ToolSchema) => boolean;
	/** Tool dispatcher. Receives the sub-agent's tool calls — NOT the
	 *  parent's. The dispatcher MUST validate against the restricted
	 *  whitelist too (belt-and-suspenders); otherwise a malformed
	 *  LLM response could invoke a filtered-out tool. */
	readonly onToolCall: (call: ToolCallRequest) => Promise<ToolResult>;
	/** Current recursion depth. Parent callers pass 0. A sub-agent
	 *  spawning ANOTHER sub-agent must pass 1, which this function
	 *  then rejects. */
	readonly parentDepth: number;
	/** Optional per-round reminder channel for the sub-agent. Typically
	 *  different from the parent's — e.g. a "you are a research
	 *  sub-agent, don't write" nudge instead of the parent's budget
	 *  warnings. */
	readonly reminderChannel?: ReminderChannel;
	/** Max LLM rounds inside this sub-agent. Defaults to the type's
	 *  value (research: 5, general: 5, plan: 3). */
	readonly maxRounds?: number;
	/** Explicit system prompt. Defaults to a short generic "you are a
	 *  sub-agent, return a summary" prompt matching the type. */
	readonly systemPrompt?: string;
}

export interface SubAgentResult {
	readonly type: SubAgentType;
	/** Single-string digest the parent sees as `ToolResult.message`.
	 *  Falls back to a generic line when the LLM hit the round budget
	 *  without producing assistant text. */
	readonly summary: string;
	/** Raw planner result for debug capture. Consumers typically do NOT
	 *  forward this to the parent — only the summary crosses the
	 *  boundary. Kept here so a debug log can record the full
	 *  sub-episode if the caller wants to. */
	readonly rawResult: PlannerLoopResult;
	/** Rolled-up usage so the caller can attribute tokens to the
	 *  parent's mission/agent budget. */
	readonly usage: TokenUsage;
	/** How many restricted tools the sub-agent ultimately got. Useful
	 *  for debug logs and dashboards; if it drops to 0 the filter was
	 *  too aggressive and the sub-agent probably couldn't do anything. */
	readonly availableToolCount: number;
}

/**
 * Thrown when a sub-agent tries to spawn another sub-agent. Callers
 * at the tool-registry `task` handler layer also check this, but the
 * primitive throws as a defense-in-depth signal the consumer handler
 * shouldn't swallow silently.
 */
export class SubAgentRecursionError extends Error {
	constructor(depth: number) {
		super(
			`Sub-agents are one-level-deep only; caller passed parentDepth=${depth}. ` +
				`MAX_SUB_AGENT_DEPTH=${MAX_SUB_AGENT_DEPTH}.`
		);
		this.name = 'SubAgentRecursionError';
	}
}

function defaultSystemPrompt(type: SubAgentType): string {
	const base =
		'Du bist ein Sub-Agent. Fuehre genau die Aufgabe aus, die dir der Parent ' +
		'Agent gibt, und liefere eine knappe Summary am Ende. Keine Seitendiskussion.';
	if (type === 'research') {
		return (
			base +
			'\n\nArchetyp: research. Du darfst nur Lese-Tools verwenden. Schreibe ' +
			'nichts. Ergebnis = Summary deiner Funde in maximal 10 Zeilen.'
		);
	}
	if (type === 'plan') {
		return (
			base +
			'\n\nArchetyp: plan. Keine Tool-Calls wenn moeglich. Denke durch die ' +
			'Aufgabe und formuliere einen strukturierten Plan (3-5 Schritte) als ' +
			'Summary.'
		);
	}
	return (
		base +
		'\n\nArchetyp: general. Nutze Tools wie ein Parent-Agent es tun wuerde, ' +
		'aber halte die Summary auf das Wesentliche beschraenkt.'
	);
}

/**
 * Launch an in-process sub-agent. See module docstring for the four
 * invariants this enforces.
 *
 * The returned `summary` is the single artifact that should cross back
 * to the parent (typically as a `task` tool-result message). Everything
 * else (`rawResult`, individual tool calls) is kept for the caller's
 * own debug log but NEVER rendered into the parent's messages array.
 */
export async function runSubAgent(input: RunSubAgentInput): Promise<SubAgentResult> {
	if (input.parentDepth >= MAX_SUB_AGENT_DEPTH) {
		throw new SubAgentRecursionError(input.parentDepth);
	}

	const filter = input.toolFilter ?? DEFAULT_TOOL_FILTERS[input.type];
	const restrictedTools = input.parentTools.filter(filter);
	const maxRounds = input.maxRounds ?? DEFAULT_MAX_ROUNDS[input.type];
	const systemPrompt = input.systemPrompt ?? defaultSystemPrompt(input.type);
	const model = input.model ?? '';

	// The loop requires a model string; surface a clear error rather
	// than letting the LLM client fail with a cryptic provider error.
	if (!model) {
		throw new Error(
			`runSubAgent: no model supplied. Pass opts.model explicitly — sub-agents ` +
				`default to nothing on purpose so routing to a cheaper tier (Haiku) is ` +
				`an explicit decision by the caller.`
		);
	}

	const rawResult = await runPlannerLoop({
		llm: input.llm,
		input: {
			systemPrompt,
			userPrompt: input.task,
			tools: restrictedTools,
			model,
			maxRounds,
			reminderChannel: input.reminderChannel,
			// No compactor for sub-agents: they are short-lived by
			// construction (maxRounds ≤ 5). If the caller needs a
			// deeper sub-agent, lift that decision up — don't double
			// the LLM call count inside a disposable context.
		},
		onToolCall: async (call: ToolCallRequest): Promise<ToolResult> => {
			// Belt-and-suspenders: even though `restrictedTools` was
			// passed to the loop, a buggy LLM response could still
			// name a tool outside the whitelist. Reject it here so the
			// caller's dispatcher never runs an unauthorised tool.
			const isWhitelisted = restrictedTools.some((t) => t.name === call.name);
			if (!isWhitelisted) {
				return {
					success: false,
					message:
						`Tool ${call.name} ist fuer diesen Sub-Agent (${input.type}) ` +
						`nicht freigegeben. Wechsel die Strategie oder brich ab.`,
				};
			}
			return input.onToolCall(call);
		},
	});

	const summary =
		rawResult.summary ??
		`(Sub-Agent ${input.type} beendet nach ${rawResult.rounds} Runden ohne Summary.)`;

	return {
		type: input.type,
		summary,
		rawResult,
		usage: rawResult.usage,
		availableToolCount: restrictedTools.length,
	};
}
