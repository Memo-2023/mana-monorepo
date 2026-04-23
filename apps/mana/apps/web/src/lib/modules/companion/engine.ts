/**
 * Companion Chat Engine — runs the shared runPlannerLoop against the
 * mana-llm client with native function calling. Identical pipeline to
 * the Mission Runner (commit 5a) — the only difference is what the
 * LLM sees: a system prompt framed for conversation rather than for
 * autonomous mission execution, plus the user's prior chat history.
 *
 * Tool calls execute directly under the USER_ACTOR (the caller is the
 * human typing in the chat UI; there is no intermediate approval). If
 * a tool's agent-policy says deny, the executor returns a refusal and
 * the LLM relays it in its response.
 */

import {
	runPlannerLoop,
	AI_TOOL_CATALOG,
	AI_TOOL_CATALOG_BY_NAME,
	compactHistory,
	createTaskToolHandler,
	TASK_TOOL_NAME,
	TASK_TOOL_SCHEMA,
	type ChatMessage,
	type ToolCallRequest,
	type ToolResult,
} from '@mana/shared-ai';
import { createManaLlmClient } from '$lib/data/ai/missions/llm-client';
import { executeTool } from '$lib/data/tools/executor';
import { getTool } from '$lib/data/tools/registry';
import { generateContextDocument } from '$lib/data/projections/context-document';
import { emitDomainEvent } from '$lib/data/events';
import type { DaySnapshot, StreakInfo } from '$lib/data/projections/types';
import type { LocalMessage } from './types';

const MAX_TOOL_ROUNDS = 3;

/**
 * Context-window ceiling for the compactor. gemini-2.5-flash supports
 * 1M tokens; the Companion chat rarely gets anywhere near that because
 * we cap rounds at 3, but long chat histories plus chatty tool results
 * (list_tasks on a power user) can still push us toward it. Kept as a
 * module constant rather than env-wired — the webapp's Vite build would
 * need a PUBLIC_ prefix and local-first apps shouldn't ship that kind
 * of flag to the browser when the default already works.
 */
const COMPACT_MAX_CTX = 1_000_000;

const llm = createManaLlmClient();

interface EngineResult {
	content: string;
	toolCalls: {
		name: string;
		params: Record<string, unknown>;
		result: ToolResult;
	}[];
}

function buildSystemPrompt(day: DaySnapshot, streaks: StreakInfo[]): string {
	const context = generateContextDocument(day, streaks);
	return [
		'Du bist der Mana Companion — ein hilfreicher persönlicher Assistent.',
		'Du hast Zugriff auf die Daten und Aktionen des Nutzers über Function-Calling-Tools.',
		'',
		context,
		'',
		'## Verhalten',
		'',
		'- Antworte auf Deutsch',
		'- Sei kurz und hilfreich',
		'- Rufe Tools proaktiv auf wenn der Nutzer Daten sehen oder etwas tun will — erfinde keine Daten.',
		'- Bei einem "Welche Tasks habe ich?"-Stil: erst `list_tasks` aufrufen, dann antworten.',
		'- Bei "Log 200ml Wasser" → `log_drink` aufrufen.',
		'- Nach einem Tool-Ergebnis fasse kurz zusammen was der Nutzer wissen soll.',
		'- Ermutige den Nutzer bei Fortschritt und Streaks.',
	].join('\n');
}

/** Turn the companion's LocalMessage history into shared-ai ChatMessages.
 *  tool_result entries come back as user-role messages so the LLM can
 *  reference them across turns (we don't keep tool_call_ids across UI
 *  refreshes, so we can't round-trip them as role='tool'). */
function historyToChatMessages(history: LocalMessage[]): ChatMessage[] {
	const out: ChatMessage[] = [];
	for (const m of history) {
		if (m.role === 'tool_result' && m.toolResult) {
			const data = m.toolResult.data ? `\nData: ${JSON.stringify(m.toolResult.data)}` : '';
			out.push({
				role: 'user',
				content: `[Previous tool result]\n${m.toolResult.message}${data}`,
			});
		} else if (m.role === 'assistant' && m.toolCall) {
			// Empty placeholder for an old-style tool call — skip.
			continue;
		} else if (m.role === 'user' || m.role === 'assistant') {
			if (m.content) out.push({ role: m.role, content: m.content });
		}
	}
	return out;
}

export async function runCompanionChat(
	userMessage: string,
	history: LocalMessage[],
	day: DaySnapshot,
	streaks: StreakInfo[],
	_onToken?: (token: string) => void
): Promise<EngineResult> {
	const systemPrompt = buildSystemPrompt(day, streaks);
	const priorMessages = historyToChatMessages(history);
	const toolCalls: EngineResult['toolCalls'] = [];

	// The parent tool catalog the sub-agent may filter down from.
	// TASK_TOOL_SCHEMA itself is NOT in parentTools — a sub-agent can't
	// launch a nested sub-agent by construction (recursion guard).
	const toolsWithTask = [...AI_TOOL_CATALOG, TASK_TOOL_SCHEMA];

	// Local dispatcher the planner's loop invokes and — via the task
	// handler's parentOnToolCall — also any sub-agent. Hoisted so the
	// task handler can close over it before the loop sets the branch.
	const dispatchTool = async (call: ToolCallRequest): Promise<ToolResult> => {
		const startedAt = Date.now();
		const toolResult = await executeTool(call.name, call.arguments);
		const latencyMs = Date.now() - startedAt;

		const toolDef = getTool(call.name);
		emitDomainEvent('CompanionToolCalled', 'companion', 'tools', call.name, {
			tool: call.name,
			module: toolDef?.module ?? 'unknown',
			success: toolResult.success,
			latencyMs,
			errorMessage: toolResult.success ? undefined : toolResult.message,
		});

		toolCalls.push({ name: call.name, params: call.arguments, result: toolResult });
		return toolResult;
	};

	// Sub-agent handler bound to this session. parentDepth = 0 means
	// the sub-agent itself will refuse to launch another one (recursion
	// guard inside runSubAgent). Model is the cheap tier — sub-agents
	// are summarisation-heavy so flash-lite is the right default.
	const taskHandler = createTaskToolHandler({
		llm,
		model: 'google/gemini-2.5-flash-lite',
		parentDepth: 0,
		parentTools: AI_TOOL_CATALOG,
		parentOnToolCall: dispatchTool,
	});

	try {
		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt,
				userPrompt: userMessage,
				priorMessages,
				tools: toolsWithTask,
				model: 'google/gemini-2.5-flash',
				maxRounds: MAX_TOOL_ROUNDS,
				temperature: 0.7,
				// Parallelise reads (auto-policy tools) when the LLM
				// fans out multiple list_*/get_* calls in one round.
				// Writes (propose policy) stay sequential to preserve
				// user-visible intent order in the proposal inbox.
				isParallelSafe: (name) => AI_TOOL_CATALOG_BY_NAME.get(name)?.defaultPolicy === 'auto',
				// Fold the middle of messages into a compact-summary at
				// 92% of the model's context window. compactHistory
				// defaults to DEFAULT_COMPACT_MODEL (gemini-2.5-flash-lite)
				// — cheaper than the planner's own model. Summarisation
				// doesn't need the same tier as reasoning.
				compactor: {
					maxContextTokens: COMPACT_MAX_CTX,
					compact: async (msgs) => {
						const res = await compactHistory(msgs, { llm });
						return { messages: res.messages, compactedTurns: res.compactedTurns };
					},
				},
			},
			onToolCall: async (call: ToolCallRequest): Promise<ToolResult> => {
				// Route `task` calls into the sub-agent handler. Everything
				// else goes through the regular executor.
				if (call.name === TASK_TOOL_NAME) {
					const result = await taskHandler.handle(call);
					toolCalls.push({ name: call.name, params: call.arguments, result });
					return result;
				}
				return dispatchTool(call);
			},
		});

		const content =
			result.summary ??
			(toolCalls.length > 0
				? toolCalls.map((tc) => tc.result.message).join('\n')
				: 'Keine Antwort erhalten.');

		return { content, toolCalls };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return {
			content: `LLM nicht verfügbar: ${msg}\n\n[KI-Einstellungen öffnen](/?app=settings#ai-options)`,
			toolCalls,
		};
	}
}

/** The companion speaks to mana-llm unconditionally — readiness is a
 *  property of the backend, not a client preference. Kept as a function
 *  for API compatibility with the CompanionChat component. */
export function isCompanionAvailable(): boolean {
	return true;
}
