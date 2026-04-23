/**
 * One tick's worth of Claude-Agent-SDK interaction for a single persona.
 *
 * Two phases per tick:
 *
 *   1. **Main loop** — Claude is given the persona's system prompt and
 *      an instruction to spend one simulated day using Mana through the
 *      MCP tools. We stream the session, collect every tool-use event
 *      as an ActionRow, note which modules got touched.
 *
 *   2. **Rating loop** — same system prompt, but the user message asks
 *      for a structured JSON rating of every module the persona used.
 *      We parse the last assistant text block as JSON and convert to
 *      FeedbackRows. Invalid JSON → one `failed-rating` row so the
 *      operator can see it in the dashboard.
 *
 * Claude-Agent-SDK does all MCP plumbing internally: we hand it a
 * Streamable-HTTP URL + the persona's JWT, it discovers the tools,
 * auto-invokes them, and streams back SDKMessage events.
 */

import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { createHash, randomUUID } from 'node:crypto';
import type { ActionRow, FeedbackRow } from './types.ts';

export interface SessionInput {
	tickId: string;
	personaEmail: string;
	systemPrompt: string;
	moduleMix: Record<string, number>;
	mcpUrl: string;
	jwt: string;
	spaceId: string;
	anthropicApiKey: string;
	/** Max tool-call turns per phase. 15 leaves headroom without runaway cost. */
	maxTurns?: number;
}

export interface SessionResult {
	actions: ActionRow[];
	feedback: FeedbackRow[];
	modulesUsed: Set<string>;
}

function hashInput(args: unknown): string {
	try {
		return createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16);
	} catch {
		return '';
	}
}

/**
 * Module names are embedded in tool names as `module.verb` (registry
 * convention in `@mana/tool-registry`). Extract the prefix so we know
 * which modules the persona actually touched.
 */
function moduleOf(toolName: string): string | null {
	const dot = toolName.indexOf('.');
	return dot > 0 ? toolName.slice(0, dot) : null;
}

// ─── Main loop ────────────────────────────────────────────────────

export async function runMainTurn(input: SessionInput): Promise<SessionResult> {
	const actions: ActionRow[] = [];
	const modulesUsed = new Set<string>();

	const today = new Date().toISOString().slice(0, 10);
	const userPrompt =
		`Heute ist ${today}. Du hast Zugriff auf deine persönliche Mana-App durch die bereitgestellten Tools.\n` +
		`Verbringe einen kurzen "Tag" in der App — was würdest du heute tatsächlich tun? Nutze 3–8 Tools.\n` +
		`Module, die dir besonders liegen: ${Object.keys(input.moduleMix).join(', ')}.\n` +
		`Wenn du fertig bist, schreibe kurz (1–2 Sätze) was du heute gemacht hast.`;

	// The SDK picks up ANTHROPIC_API_KEY from env.
	process.env.ANTHROPIC_API_KEY ??= input.anthropicApiKey;

	const q = query({
		prompt: userPrompt,
		options: {
			systemPrompt: input.systemPrompt,
			maxTurns: input.maxTurns ?? 15,
			mcpServers: {
				mana: {
					type: 'http',
					url: `${input.mcpUrl}/mcp`,
					headers: {
						authorization: `Bearer ${input.jwt}`,
						'x-mana-space': input.spaceId,
					},
				},
			},
			// Built-in tools off — the persona should only touch Mana tools.
			tools: [],
		},
	});

	for await (const msg of q as AsyncIterable<SDKMessage>) {
		collectActionsFromMessage(msg, input.tickId, actions, modulesUsed);
	}

	return { actions, feedback: [], modulesUsed };
}

// ─── Rating loop ──────────────────────────────────────────────────

export async function runRatingTurn(
	input: SessionInput,
	modulesUsed: Set<string>
): Promise<FeedbackRow[]> {
	if (modulesUsed.size === 0) return [];

	const list = [...modulesUsed].join(', ');
	const prompt =
		`Bewerte bitte jedes Modul, das du heute genutzt hast (${list}), auf einer Skala 1–5 ` +
		`(1 = frustrierend, 5 = hilft mir wirklich). Antworte AUSSCHLIESSLICH als JSON in diesem Format:\n` +
		`{"ratings": [{"module": "todo", "rating": 4, "notes": "kurz begründet"}, ...]}\n` +
		`Keine Prosa außerhalb des JSON-Blocks.`;

	process.env.ANTHROPIC_API_KEY ??= input.anthropicApiKey;

	const q = query({
		prompt,
		options: {
			systemPrompt: input.systemPrompt,
			maxTurns: 1,
			tools: [],
		},
	});

	let text = '';
	for await (const msg of q as AsyncIterable<SDKMessage>) {
		text += extractAssistantText(msg);
	}

	return parseRatings(text, input.tickId, modulesUsed);
}

// ─── Parsers ──────────────────────────────────────────────────────

function collectActionsFromMessage(
	msg: SDKMessage,
	tickId: string,
	actions: ActionRow[],
	modulesUsed: Set<string>
): void {
	// SDKMessage is a big union; we only care about assistant messages
	// that contain tool_use blocks, and user messages that contain
	// tool_result blocks (so we know success/failure).
	const raw = msg as unknown as {
		type?: string;
		message?: { content?: Array<Record<string, unknown>> };
	};
	if (raw.type !== 'assistant' && raw.type !== 'user') return;
	const content = raw.message?.content;
	if (!Array.isArray(content)) return;

	for (const block of content) {
		const blockType = block.type;
		if (blockType === 'tool_use' && typeof block.name === 'string') {
			const toolName = block.name;
			const mod = moduleOf(toolName);
			if (mod) modulesUsed.add(mod);
			actions.push({
				tickId,
				toolName,
				inputHash: hashInput(block.input),
				result: 'ok', // provisional; rewritten on matching tool_result if it was an error
			});
		} else if (blockType === 'tool_result') {
			const isError = block.is_error === true;
			if (!isError) continue;
			// Flip the most recent action that matches this tool_use_id.
			const toolUseId = typeof block.tool_use_id === 'string' ? block.tool_use_id : null;
			if (!toolUseId) continue;
			// We didn't store tool_use_id (would require pairing state); cheap
			// fallback: mark the last action as error. Good enough for the
			// audit dashboard; precise attribution lands in a later iteration.
			const last = actions[actions.length - 1];
			if (last) {
				last.result = 'error';
				last.errorMessage = stringifyBlock(block);
			}
		}
	}
}

function extractAssistantText(msg: SDKMessage): string {
	const raw = msg as unknown as {
		type?: string;
		message?: { content?: Array<Record<string, unknown>> };
	};
	if (raw.type !== 'assistant') return '';
	const content = raw.message?.content;
	if (!Array.isArray(content)) return '';
	let out = '';
	for (const block of content) {
		if (block.type === 'text' && typeof block.text === 'string') out += block.text;
	}
	return out;
}

function stringifyBlock(block: Record<string, unknown>): string {
	try {
		return JSON.stringify(block.content ?? block).slice(0, 500);
	} catch {
		return '<unserializable error>';
	}
}

function parseRatings(text: string, tickId: string, modulesUsed: Set<string>): FeedbackRow[] {
	// Tolerate surrounding whitespace and accidental code fences.
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) {
		return [
			{
				tickId,
				module: '__parse',
				rating: 3,
				notes: `Claude returned non-JSON: ${text.slice(0, 200)}`,
			},
		];
	}
	try {
		const parsed = JSON.parse(match[0]) as {
			ratings?: Array<{ module: string; rating: number; notes?: string }>;
		};
		const ratings = parsed.ratings ?? [];
		const rows: FeedbackRow[] = [];
		for (const r of ratings) {
			if (typeof r.module !== 'string') continue;
			if (!modulesUsed.has(r.module)) continue;
			const rating = Math.max(1, Math.min(5, Math.round(r.rating))) as FeedbackRow['rating'];
			rows.push({
				tickId,
				module: r.module,
				rating,
				notes: typeof r.notes === 'string' ? r.notes.slice(0, 1000) : undefined,
			});
		}
		return rows;
	} catch (err) {
		return [
			{
				tickId,
				module: '__parse',
				rating: 3,
				notes: `JSON.parse failed: ${err instanceof Error ? err.message : String(err)}`,
			},
		];
	}
}

export function newTickId(): string {
	return randomUUID();
}
