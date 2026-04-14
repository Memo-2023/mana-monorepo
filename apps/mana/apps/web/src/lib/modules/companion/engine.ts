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
import { emitDomainEvent } from '$lib/data/events';
import { getTool } from '$lib/data/tools/registry';
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

## Verfuegbare Tools

${toolList}

## Tool-Aufruf Format — WICHTIG

**Du MUSST Tools nutzen wenn der Nutzer Daten sehen oder etwas tun will.**

Wenn der Nutzer fragt:
- "Welche Tasks habe ich?" → \`list_tasks\` aufrufen
- "Wie viel Wasser?" → \`get_drink_progress\` aufrufen
- "Erstell mir einen Task X" → \`create_task\` aufrufen
- "Log 200ml Wasser" → \`log_drink\` aufrufen
- "Welche Termine heute?" → \`get_todays_events\` aufrufen
- "Erledige Task X" (per Name) → \`complete_tasks_by_title\` mit titleMatch

Tool-Aufruf in genau diesem Format (NUR JSON in einem Code-Block):
\`\`\`tool
{"name": "tool_name", "params": {"key": "value"}}
\`\`\`

Nach dem Tool-Ergebnis bekommst du die Daten zurueck und kannst dem Nutzer antworten.

## ID-Konvention

Listen-Tools (wie \`list_tasks\`) zeigen IDs in eckigen Klammern: \`• [abc123] Task-Titel\`.
Wenn der Nutzer eine Aktion auf einem Listen-Eintrag will, nutze diese ID fuer den Tool-Aufruf
(z.B. \`complete_task\` mit \`taskId: "abc123"\`).

Du kannst Tool-Results aus VORHERIGEN Nachrichten referenzieren — sie sind als
"[Previous tool result]" markiert.

## Verhalten

- Antworte auf Deutsch
- Sei kurz und hilfreich
- **Erfinde keine Daten** — wenn du Listen oder Werte brauchst, RUFE EIN TOOL AUF
- Zeige dem Nutzer NIE die rohen IDs in eckigen Klammern — die sind nur fuer dich
- Wenn der Nutzer etwas loggen oder erstellen will, nutze das passende Tool
- Ermutige den Nutzer bei Fortschritt und Streaks`;
}

function extractToolCall(
	text: string
): { name: string; params: Record<string, unknown>; before: string; after: string } | null {
	// Try fenced ```tool block first
	const fenced = /```(?:tool|json)?\s*\n?([\s\S]*?)\n?```/;
	const fencedMatch = text.match(fenced);
	if (fencedMatch) {
		try {
			const parsed = JSON.parse(fencedMatch[1]) as {
				name: string;
				params: Record<string, unknown>;
			};
			if (parsed.name) {
				const before = text.slice(0, fencedMatch.index).trim();
				const after = text.slice((fencedMatch.index ?? 0) + fencedMatch[0].length).trim();
				return { name: parsed.name, params: parsed.params ?? {}, before, after };
			}
		} catch {
			// Fall through to bare JSON detection
		}
	}

	// Fallback: bare JSON object with "name" and "params" keys
	const bareJson = /\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"params"\s*:\s*\{[^}]*\}\s*\}/;
	const bareMatch = text.match(bareJson);
	if (bareMatch) {
		try {
			const parsed = JSON.parse(bareMatch[0]) as { name: string; params: Record<string, unknown> };
			if (parsed.name) {
				const before = text.slice(0, bareMatch.index).trim();
				const after = text.slice((bareMatch.index ?? 0) + bareMatch[0].length).trim();
				return { name: parsed.name, params: parsed.params ?? {}, before, after };
			}
		} catch {
			// Not valid JSON
		}
	}

	return null;
}

function messagesToLlm(
	messages: LocalMessage[]
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
	const result: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
	for (const m of messages) {
		if (m.role === 'tool_result' && m.toolResult) {
			// Surface previous tool results to the LLM so it can
			// reference IDs/data from earlier turns.
			const data = m.toolResult.data ? `\nData: ${JSON.stringify(m.toolResult.data)}` : '';
			result.push({
				role: 'user',
				content: `[Previous tool result]\n${m.toolResult.message}${data}`,
			});
		} else if (m.role === 'assistant' && m.toolCall) {
			// Skip the empty placeholder messages for tool calls
			continue;
		} else if (m.role === 'user' || m.role === 'assistant' || m.role === 'system') {
			if (m.content) result.push({ role: m.role, content: m.content });
		}
	}
	return result;
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

		// Execute the tool with timing
		const toolStartedAt = Date.now();
		const toolResult = await executeTool(toolCall.name, toolCall.params);
		const toolLatencyMs = Date.now() - toolStartedAt;

		// Emit observability event for the tool call
		const toolDef = getTool(toolCall.name);
		emitDomainEvent('CompanionToolCalled', 'companion', 'tools', toolCall.name, {
			tool: toolCall.name,
			module: toolDef?.module ?? 'unknown',
			success: toolResult.success,
			latencyMs: toolLatencyMs,
			errorMessage: toolResult.success ? undefined : toolResult.message,
		});

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
