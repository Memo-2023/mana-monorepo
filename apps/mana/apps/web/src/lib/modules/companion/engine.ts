/**
 * Companion Chat Engine — Orchestrates LLM + Context Document + Tool Calling.
 *
 * Flow:
 * 1. Build system prompt from Context Document (projections + streaks)
 * 2. Collect conversation history
 * 3. Send to LLM with tool schemas
 * 4. If LLM returns tool_use → execute tool → feed result back → repeat
 * 5. Return final assistant message
 *
 * Currently uses @mana/local-llm directly (Gemma, browser-local).
 * Tool calling is simulated via JSON extraction since Gemma doesn't
 * natively support function calling — the system prompt instructs the
 * model to output JSON when it wants to call a tool.
 */

import { generate, getLocalLlmStatus, loadLocalLlm } from '@mana/local-llm';
import { generateContextDocument } from '$lib/data/projections/context-document';
import { getToolsForLlm, executeTool } from '$lib/data/tools';
import type { DaySnapshot, StreakInfo } from '$lib/data/projections/types';
import type { LocalMessage } from './types';
import type { ToolResult } from '$lib/data/tools/types';

const MAX_TOOL_ROUNDS = 3;

interface EngineResult {
	content: string;
	toolCalls: { name: string; params: Record<string, unknown>; result: ToolResult }[];
}

function buildSystemPrompt(day: DaySnapshot, streaks: StreakInfo[]): string {
	const context = generateContextDocument(day, streaks);
	const toolSchemas = getToolsForLlm();
	const toolList = toolSchemas.map((t) => `- ${t.name}: ${t.description}`).join('\n');

	return `Du bist der Mana Companion — ein hilfreicher persoenlicher Assistent.
Du hast Zugriff auf die Daten und Aktionen des Nutzers ueber verschiedene Module.

${context}

## Verfuegbare Aktionen

${toolList}

## Tool-Aufruf Format

Wenn du eine Aktion ausfuehren willst, antworte mit einem JSON-Block:
\`\`\`tool
{"name": "tool_name", "params": {"key": "value"}}
\`\`\`

Du kannst pro Antwort EINEN Tool-Aufruf machen. Nach dem Ergebnis kannst du weiter antworten.
Wenn du keine Aktion ausfuehren willst, antworte einfach mit Text.

## Verhalten

- Antworte auf Deutsch
- Sei kurz und hilfreich
- Nutze die Kontext-Daten um relevante Vorschlaege zu machen
- Wenn der Nutzer etwas loggen will, nutze das passende Tool
- Ermutige den Nutzer bei Fortschritt und Streaks`;
}

function extractToolCall(
	text: string
): { name: string; params: Record<string, unknown>; before: string; after: string } | null {
	const toolBlockRegex = /```tool\s*\n?([\s\S]*?)\n?```/;
	const match = text.match(toolBlockRegex);
	if (!match) return null;

	try {
		const parsed = JSON.parse(match[1]) as { name: string; params: Record<string, unknown> };
		if (!parsed.name) return null;
		const before = text.slice(0, match.index).trim();
		const after = text.slice((match.index ?? 0) + match[0].length).trim();
		return { name: parsed.name, params: parsed.params ?? {}, before, after };
	} catch {
		return null;
	}
}

function messagesToLlm(
	messages: LocalMessage[]
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
	return messages
		.filter((m) => m.role !== 'tool_result')
		.map((m) => ({
			role:
				m.role === 'tool_result' ? ('user' as const) : (m.role as 'user' | 'assistant' | 'system'),
			content: m.content,
		}));
}

/**
 * Send a message to the Companion and get a response.
 *
 * @param userMessage  - The user's input text
 * @param history      - Previous messages in this conversation
 * @param day          - Current DaySnapshot projection
 * @param streaks      - Current streak info
 * @param onToken      - Streaming callback for progressive UI updates
 */
export async function runCompanionChat(
	userMessage: string,
	history: LocalMessage[],
	day: DaySnapshot,
	streaks: StreakInfo[],
	onToken?: (token: string) => void
): Promise<EngineResult> {
	// Ensure local LLM is loaded
	const status = getLocalLlmStatus();
	if (status.current.state !== 'ready') {
		await loadLocalLlm();
	}

	const systemPrompt = buildSystemPrompt(day, streaks);
	const toolCalls: EngineResult['toolCalls'] = [];

	// Build message chain
	const llmMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
		{ role: 'system', content: systemPrompt },
		...messagesToLlm(history),
		{ role: 'user', content: userMessage },
	];

	let finalContent = '';

	for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
		const result = await generate({
			messages: llmMessages,
			temperature: 0.7,
			maxTokens: 1024,
			onToken: round === 0 ? onToken : undefined, // Only stream first round
		});

		const text = result.content;
		const toolCall = extractToolCall(text);

		if (!toolCall) {
			finalContent = text;
			break;
		}

		// Execute the tool
		const toolResult = await executeTool(toolCall.name, toolCall.params);
		toolCalls.push({ name: toolCall.name, params: toolCall.params, result: toolResult });

		// Build response text from before/after the tool block
		const parts = [toolCall.before, toolCall.after].filter(Boolean);

		// Feed tool result back into conversation
		llmMessages.push({
			role: 'assistant',
			content: text,
		});
		llmMessages.push({
			role: 'user',
			content: `Tool-Ergebnis fuer ${toolCall.name}: ${toolResult.message}${toolResult.data ? `\nDaten: ${JSON.stringify(toolResult.data)}` : ''}`,
		});

		// If this was the last round, use what we have
		if (round === MAX_TOOL_ROUNDS) {
			finalContent = parts.join('\n\n') || `Aktion ausgefuehrt: ${toolResult.message}`;
		}
	}

	return { content: finalContent, toolCalls };
}

/**
 * Check if the Companion Chat is available (LLM loaded or loadable).
 */
export function isCompanionAvailable(): boolean {
	const status = getLocalLlmStatus();
	return status.current.state === 'ready' || status.current.state === 'idle';
}
