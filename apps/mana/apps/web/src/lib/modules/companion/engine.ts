/**
 * Companion Chat Engine — Orchestrates LLM + Context Document + Tool Calling.
 *
 * Tries local LLM (Gemma via @mana/local-llm) first. If WebGPU is not
 * available, falls back to the mana-llm server endpoint. Tool calling
 * uses JSON extraction from the LLM output.
 */

import { generate, getLocalLlmStatus, loadLocalLlm, isLocalLlmSupported } from '@mana/local-llm';
import { generateContextDocument } from '$lib/data/projections/context-document';
import { getToolsForLlm, executeTool } from '$lib/data/tools';
import { authStore } from '$lib/stores/auth.svelte';
import type { DaySnapshot, StreakInfo } from '$lib/data/projections/types';
import type { LocalMessage } from './types';
import type { ToolResult } from '$lib/data/tools/types';

const MAX_TOOL_ROUNDS = 3;

type LlmMessage = { role: 'user' | 'assistant' | 'system'; content: string };

/** Try local LLM, fall back to server if WebGPU unavailable. */
async function callLlm(messages: LlmMessage[], onToken?: (token: string) => void): Promise<string> {
	// Try local first (WebGPU + Gemma)
	if (isLocalLlmSupported()) {
		const status = getLocalLlmStatus();
		if (status.current.state !== 'ready') {
			try {
				await loadLocalLlm();
			} catch {
				// Fall through to server
				return callServerLlm(messages);
			}
		}
		const result = await generate({ messages, temperature: 0.7, maxTokens: 1024, onToken });
		return result.content;
	}

	// Fallback: server-side LLM via mana-api
	return callServerLlm(messages);
}

async function callServerLlm(messages: LlmMessage[]): Promise<string> {
	const apiUrl =
		(typeof window !== 'undefined' &&
			(window as unknown as Record<string, string>).__PUBLIC_MANA_API_URL__) ||
		import.meta.env.PUBLIC_MANA_API_URL ||
		'';

	if (!apiUrl) {
		return 'LLM nicht verfuegbar — weder WebGPU noch Server-Endpoint konfiguriert.';
	}

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	try {
		const token = await authStore.getValidToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;
	} catch {
		// Continue without auth — server will decide
	}

	const response = await fetch(`${apiUrl}/api/v1/chat/completions`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ messages, model: 'companion' }),
	});

	if (!response.ok) {
		const err = await response.text().catch(() => response.statusText);
		return `Server-Fehler: ${err}`;
	}

	const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
	return data.choices?.[0]?.message?.content ?? 'Keine Antwort vom Server.';
}

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
	const systemPrompt = buildSystemPrompt(day, streaks);
	const toolCalls: EngineResult['toolCalls'] = [];

	const llmMessages: LlmMessage[] = [
		{ role: 'system', content: systemPrompt },
		...messagesToLlm(history),
		{ role: 'user', content: userMessage },
	];

	let finalContent = '';

	for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
		const text = await callLlm(llmMessages, round === 0 ? onToken : undefined);
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
 * Check if the Companion Chat is available.
 * Returns true if either local LLM or server endpoint is usable.
 */
export function isCompanionAvailable(): boolean {
	// Local LLM available?
	if (isLocalLlmSupported()) {
		const status = getLocalLlmStatus();
		if (status.current.state === 'ready' || status.current.state === 'idle') return true;
	}
	// Server fallback configured?
	const apiUrl =
		(typeof window !== 'undefined' &&
			(window as unknown as Record<string, string>).__PUBLIC_MANA_API_URL__) ||
		import.meta.env.PUBLIC_MANA_API_URL ||
		'';
	return !!apiUrl;
}
