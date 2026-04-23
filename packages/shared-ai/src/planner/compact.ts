/**
 * Context-window compactor — the `wU2` pattern from Claude Code,
 * adapted for our `runPlannerLoop` messages shape.
 *
 * Why we need it: when a mission (or companion chat) spans many rounds
 * with chatty tool results, the `messages[]` list grows until the next
 * LLM call overflows the provider's context window. The naive failure
 * mode is a 400 from the provider; the subtler one is silent
 * quality-degradation as the LLM loses earlier turns.
 *
 * Claude Code handles this with a pre-emptive trigger at ~92 % of the
 * context budget: run the current history through a second LLM call
 * with a compact-prompt that forces a fixed schema — Goal, Decisions,
 * Tools Called, Current Progress — and splice that summary back into
 * the live loop so subsequent rounds see a short synopsis instead of
 * the raw turns.
 *
 * This module ships ONLY the pure primitive:
 *   - `DEFAULT_COMPACT_THRESHOLD` — 0.92, matching Claude Code.
 *   - `shouldCompact(totalTokens, maxContextTokens)` — boolean trigger.
 *   - `compactHistory(messages, opts)` — async, calls the LLM with the
 *     compact-prompt and returns a fresh messages array with the
 *     pre-tail turns folded into one summary message.
 *
 * Wiring into `runPlannerLoop` (trigger + splice) is a follow-up PR;
 * keeping the primitive separate means we can unit-test compression
 * without mocking the loop state machine.
 */

import type { ChatMessage, LlmClient } from './loop';

/** Default trigger threshold: Claude Code's `wU2` fires at ~92 %. */
export const DEFAULT_COMPACT_THRESHOLD = 0.92;

/** How many recent turns to keep VERBATIM, tail-first. The compactor
 *  never touches these — the LLM's most recent in-progress reasoning
 *  should stay intact for coherence. */
export const DEFAULT_COMPACT_KEEP_RECENT = 4;

/**
 * Cheap "fast-tier" model the compactor runs on by default. Matches
 * Claude Code's pattern of routing utility tasks (summarisation,
 * topic detection, session-summary) to Haiku instead of burning the
 * primary-tier budget on them.
 *
 * google/gemini-2.5-flash-lite is ~3–5x cheaper than gemini-2.5-flash
 * with near-identical summarisation quality. Consumers that need
 * something different (cost policy, offline fallback to Ollama) can
 * override per-call via `CompactHistoryOptions.model`.
 *
 * Format follows mana-llm's `provider/model` convention.
 */
export const DEFAULT_COMPACT_MODEL = 'google/gemini-2.5-flash-lite';

/**
 * Decide whether to compact based on token usage against a ceiling.
 * Returns false on missing inputs so the caller can skip silently when
 * the provider doesn't report usage (which is common for local models).
 */
export function shouldCompact(
	totalTokens: number,
	maxContextTokens: number | undefined,
	threshold: number = DEFAULT_COMPACT_THRESHOLD
): boolean {
	if (!maxContextTokens || maxContextTokens <= 0) return false;
	if (totalTokens <= 0) return false;
	return totalTokens / maxContextTokens >= threshold;
}

/**
 * Structured shape the compactor prompt asks the LLM to produce. We
 * parse loosely — if any field is missing we fill with empty strings,
 * because a partial compaction is still better than no compaction.
 */
export interface CompactSummary {
	readonly goal: string;
	readonly decisions: string;
	readonly toolsCalled: string;
	readonly currentProgress: string;
}

export const COMPACT_SYSTEM_PROMPT = `Du bist ein Compact-Agent. Komprimiere die nachfolgende Konversation nach festem Schema, damit sie in einen knappen Kontext passt.

Beantworte AUSSCHLIESSLICH mit einem Markdown-Block in exakt dieser Struktur:

## Goal
<Ein Satz. Was war das urspruengliche Ziel?>

## Decisions
<Stichpunkte. Welche Entscheidungen wurden getroffen (Richtung, Prioritaet, Scope)?>

## Tools Called
<Stichpunkte: toolname(arg-kurzform) -> Ergebnis-Kurzfassung. Fehler explizit nennen.>

## Current Progress
<Ein Satz. Wo steht die Arbeit JETZT? Was ist der naechste konkrete Schritt?>

Regeln:
- Keine Einleitung, keine Nachbemerkung. Nur der Markdown-Block.
- Keine erfundenen Fakten. Wenn du unsicher bist, schreib "unklar".
- Zitate und Begriffe 1:1 wenn sie fachlich sind (IDs, Feldnamen).
- Deutsche Antwort, auch wenn Tool-Responses englisch sind.`;

/**
 * Parse the compact-agent's response into a `CompactSummary`. Tolerant
 * — missing sections become empty strings rather than failing the
 * whole compaction.
 */
export function parseCompactSummary(raw: string): CompactSummary {
	function section(header: string): string {
		const re = new RegExp(`##\\s+${header}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
		const m = raw.match(re);
		return m ? m[1].trim() : '';
	}
	return {
		goal: section('Goal'),
		decisions: section('Decisions'),
		toolsCalled: section('Tools Called'),
		currentProgress: section('Current Progress'),
	};
}

/** Render a `CompactSummary` back to a single chat-message-ready string. */
export function renderCompactSummary(s: CompactSummary): string {
	return [
		'<compact-summary>',
		`## Goal\n${s.goal || 'unklar'}`,
		'',
		`## Decisions\n${s.decisions || '(keine)'}`,
		'',
		`## Tools Called\n${s.toolsCalled || '(keine)'}`,
		'',
		`## Current Progress\n${s.currentProgress || 'unklar'}`,
		'</compact-summary>',
	].join('\n');
}

export interface CompactHistoryOptions {
	readonly llm: LlmClient;
	/** Model to summarise with. Defaults to `DEFAULT_COMPACT_MODEL`
	 *  (gemini-2.5-flash-lite) — cheaper than the primary planner
	 *  model, which is the whole point: summarisation doesn't need
	 *  the same tier as reasoning + tool-calling. */
	readonly model?: string;
	/** How many most-recent turns to preserve verbatim. Default 4. */
	readonly keepRecent?: number;
	/** Upper bound on compactor-LLM temperature — we want summarisation,
	 *  not creativity. Default 0.2. */
	readonly temperature?: number;
}

export interface CompactHistoryResult {
	readonly messages: readonly ChatMessage[];
	readonly summary: CompactSummary;
	readonly compactedTurns: number;
	/** Token usage from the compactor call itself, when reported. */
	readonly usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Compact a message history:
 *   1. Preserve the `system` prompt verbatim (always index 0).
 *   2. Preserve the first `user` turn (the original objective).
 *   3. Send everything in between + the turns up to `keepRecent` BEFORE
 *      the tail to the compact agent.
 *   4. Preserve the last `keepRecent` turns verbatim.
 *
 * Returned messages:
 *   [ system, user, assistant(compact-summary), ...recentTurns ]
 *
 * Notes:
 *   - The compact-summary message is tagged role='assistant' because
 *     some providers reject arbitrary system messages deep in history.
 *   - If there's nothing to compact (≤ keepRecent+2 messages), the
 *     function returns the original messages unchanged — no LLM call.
 */
export async function compactHistory(
	messages: readonly ChatMessage[],
	opts: CompactHistoryOptions
): Promise<CompactHistoryResult> {
	const keepRecent = opts.keepRecent ?? DEFAULT_COMPACT_KEEP_RECENT;

	// Find anchor points.
	const firstSystem = messages.findIndex((m) => m.role === 'system');
	const firstUser = messages.findIndex((m) => m.role === 'user');

	// Bail if there's nothing to compact. Always need at least
	// system + user + keepRecent + 1 compactable turn before it's worth it.
	const minLength = (firstSystem >= 0 ? 1 : 0) + (firstUser >= 0 ? 1 : 0) + keepRecent + 1;
	if (messages.length < minLength) {
		return {
			messages,
			summary: { goal: '', decisions: '', toolsCalled: '', currentProgress: '' },
			compactedTurns: 0,
		};
	}

	const systemMsg = firstSystem >= 0 ? messages[firstSystem] : null;
	const userMsg = firstUser >= 0 ? messages[firstUser] : null;

	// Split: middle = everything between the 2 anchors and the tail;
	// tail = last keepRecent turns.
	const tailStart = messages.length - keepRecent;
	const middle = messages.slice(
		Math.max((firstUser >= 0 ? firstUser : firstSystem) + 1, 0),
		tailStart
	);
	const tail = messages.slice(tailStart);

	if (middle.length === 0) {
		return {
			messages,
			summary: { goal: '', decisions: '', toolsCalled: '', currentProgress: '' },
			compactedTurns: 0,
		};
	}

	// Ask the compact agent to summarise the MIDDLE. We give it the
	// original system+user as context so it can ground the summary
	// against the original goal, but instruct it to only produce the
	// Markdown block — not a continuation of the conversation.
	const compactRequestMessages: ChatMessage[] = [
		{ role: 'system', content: COMPACT_SYSTEM_PROMPT },
		...(systemMsg
			? [
					{
						...systemMsg,
						content: `Urspruenglicher System-Prompt:\n${systemMsg.content ?? ''}`,
					} as ChatMessage,
				]
			: []),
		...(userMsg ? [userMsg] : []),
		...middle,
		{
			role: 'user',
			content:
				'Komprimiere das obige in das Schema (## Goal / ## Decisions / ## Tools Called / ## Current Progress). Nur der Markdown-Block, keine Einleitung.',
		},
	];

	const response = await opts.llm.complete({
		messages: compactRequestMessages,
		tools: [],
		model: opts.model ?? DEFAULT_COMPACT_MODEL,
		temperature: opts.temperature ?? 0.2,
	});

	const summary = parseCompactSummary(response.content ?? '');
	const summaryMsg: ChatMessage = {
		role: 'assistant',
		content: renderCompactSummary(summary),
	};

	const compactedMessages: ChatMessage[] = [
		...(systemMsg ? [systemMsg] : []),
		...(userMsg ? [userMsg] : []),
		summaryMsg,
		...tail,
	];

	return {
		messages: compactedMessages,
		summary,
		compactedTurns: middle.length,
		usage: response.usage
			? {
					promptTokens: response.usage.promptTokens,
					completionTokens: response.usage.completionTokens,
				}
			: undefined,
	};
}
