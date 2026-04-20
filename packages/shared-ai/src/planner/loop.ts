/**
 * Multi-turn tool-calling loop shared between the webapp runner and the
 * server-side mana-ai tick. Replaces the text-JSON planner pipeline:
 * we hand the LLM a tool catalog, it emits native tool_calls, we
 * execute them and feed the results back as tool-messages until the
 * LLM has nothing more to call (or we hit the round budget).
 *
 * Environment-specific concerns (HTTP transport, auth, actor
 * attribution) live in the caller-provided ``LlmClient`` and
 * ``onToolCall`` callback. The loop itself stays pure.
 */

import type { ToolSchema } from '../tools/schemas';
import type { ToolSpec } from '../tools/function-schema';
import { toolsToFunctionSchemas } from '../tools/function-schema';

// ─── Chat-message contract ──────────────────────────────────────────

export interface ToolCallRequest {
	readonly id: string;
	readonly name: string;
	readonly arguments: Record<string, unknown>;
}

export interface ToolResult {
	readonly success: boolean;
	readonly data?: unknown;
	readonly message: string;
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
	readonly role: ChatRole;
	readonly content?: string | null;
	readonly toolCalls?: readonly ToolCallRequest[];
	readonly toolCallId?: string;
}

// ─── LLM client contract ────────────────────────────────────────────

export interface LlmCompletionRequest {
	readonly messages: readonly ChatMessage[];
	readonly tools: readonly ToolSpec[];
	readonly model: string;
	readonly temperature?: number;
}

export type LlmFinishReason = 'stop' | 'tool_calls' | 'length' | 'content_filter';

export interface TokenUsage {
	readonly promptTokens: number;
	readonly completionTokens: number;
	readonly totalTokens: number;
}

export interface LlmCompletionResponse {
	readonly content: string | null;
	readonly toolCalls: readonly ToolCallRequest[];
	readonly finishReason: LlmFinishReason;
	/** Token counts for this one call — propagated from the provider
	 *  response when available. Summed across rounds in PlannerLoopResult. */
	readonly usage?: TokenUsage;
}

export interface LlmClient {
	complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

// ─── Loop input / result ────────────────────────────────────────────

export interface PlannerLoopInput {
	readonly systemPrompt: string;
	readonly userPrompt: string;
	/** Optional prior conversation turns inserted between the system
	 *  prompt and the new user turn. Used by the companion chat to
	 *  preserve multi-turn history; missions leave this empty. */
	readonly priorMessages?: readonly ChatMessage[];
	readonly tools: readonly ToolSchema[];
	readonly model: string;
	readonly temperature?: number;
	/** Hard ceiling on planner rounds. Each round = one LLM call plus
	 *  whatever tool executions its output triggered. Defaults to 5. */
	readonly maxRounds?: number;
}

export interface ExecutedCall {
	readonly round: number;
	readonly call: ToolCallRequest;
	readonly result: ToolResult;
}

export type LoopStopReason = 'assistant-stop' | 'max-rounds' | 'no-tool-calls' | 'llm-error';

export interface PlannerLoopResult {
	readonly rounds: number;
	readonly executedCalls: readonly ExecutedCall[];
	/** Final assistant text when the LLM stopped instead of calling a
	 *  tool. ``null`` when the last turn was a tool-call burst that we
	 *  cut off via round budget. */
	readonly summary: string | null;
	readonly stopReason: LoopStopReason;
	/** Complete chat history for debug-log capture (system + user +
	 *  every assistant/tool turn). Never synced — contains decrypted
	 *  user content. */
	readonly messages: readonly ChatMessage[];
	/** Accumulated token usage across every LLM round. Zero counts when
	 *  the provider didn't report usage. Consumers use this for budget
	 *  tracking (mana-ai's per-agent daily limit) and cost telemetry. */
	readonly usage: TokenUsage;
}

// ─── The loop ───────────────────────────────────────────────────────

const DEFAULT_MAX_ROUNDS = 5;

export async function runPlannerLoop(opts: {
	readonly llm: LlmClient;
	readonly input: PlannerLoopInput;
	/** Execute a tool call and return the result that should be fed back
	 *  to the LLM as a tool-message. Must not throw — convert errors to
	 *  ``{ success: false, message }``. The loop injects the result
	 *  verbatim so the LLM can reason over failures (e.g. "vault locked
	 *  → ask user to unlock"). */
	readonly onToolCall: (call: ToolCallRequest) => Promise<ToolResult>;
}): Promise<PlannerLoopResult> {
	const { llm, input, onToolCall } = opts;
	const maxRounds = input.maxRounds ?? DEFAULT_MAX_ROUNDS;
	const toolSpecs = toolsToFunctionSchemas(input.tools);

	const messages: ChatMessage[] = [
		{ role: 'system', content: input.systemPrompt },
		...(input.priorMessages ?? []),
		{ role: 'user', content: input.userPrompt },
	];
	const executedCalls: ExecutedCall[] = [];
	let summary: string | null = null;
	let stopReason: LoopStopReason = 'max-rounds';
	let rounds = 0;
	let promptTokens = 0;
	let completionTokens = 0;

	while (rounds < maxRounds) {
		rounds++;
		const response = await llm.complete({
			messages,
			tools: toolSpecs,
			model: input.model,
			temperature: input.temperature,
		});

		if (response.usage) {
			promptTokens += response.usage.promptTokens;
			completionTokens += response.usage.completionTokens;
		}

		// Append the assistant turn to history before we execute any
		// tools — the LLM needs to see its own prior tool_calls alongside
		// the tool-message results in the next turn.
		messages.push({
			role: 'assistant',
			content: response.content,
			toolCalls: response.toolCalls.length > 0 ? response.toolCalls : undefined,
		});

		if (response.toolCalls.length === 0) {
			summary = response.content;
			stopReason = response.finishReason === 'stop' ? 'assistant-stop' : 'no-tool-calls';
			break;
		}

		// Execute each tool_call sequentially. Parallel execution is a
		// perfectly valid optimisation for pure-read tools but we keep
		// order here so the message log tells a linear story when the
		// user debugs a failure.
		for (const call of response.toolCalls) {
			const result = await onToolCall(call);
			executedCalls.push({ round: rounds, call, result });
			messages.push({
				role: 'tool',
				toolCallId: call.id,
				content: JSON.stringify({
					success: result.success,
					message: result.message,
					...(result.data !== undefined ? { data: result.data } : {}),
				}),
			});
		}

		// If the round limit is about to hit, surface it as the reason —
		// the outer consumer can mark the iteration as incomplete.
		if (rounds >= maxRounds) {
			stopReason = 'max-rounds';
			break;
		}
	}

	return {
		rounds,
		executedCalls,
		summary,
		stopReason,
		messages,
		usage: {
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
		},
	};
}
