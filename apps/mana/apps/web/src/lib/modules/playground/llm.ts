/**
 * Playground LLM client — thin wrapper around mana-llm's OpenAI-compatible
 * `/v1/chat/completions` (streaming) and `/v1/models` endpoints.
 *
 * The SSE chunk parser lives in `@mana/shared-llm/sse-parser` and is shared
 * with the LLM orchestrator's remote backend (backends/remote.ts).
 */

import { consumeSSEStream } from '@mana/shared-llm/sse-parser';

const DEFAULT_LLM_URL = 'http://localhost:3025';

/** Resolve the mana-llm base URL from the window-injected env, falling
 *  back to the local-dev default. Mirrors the photos store pattern. */
function llmUrl(): string {
	if (typeof window !== 'undefined') {
		const fromWindow = (window as unknown as { __PUBLIC_MANA_LLM_URL__?: string })
			.__PUBLIC_MANA_LLM_URL__;
		if (fromWindow) return fromWindow.replace(/\/$/, '');
	}
	const fromEnv = import.meta.env.PUBLIC_MANA_LLM_URL as string | undefined;
	return (fromEnv || DEFAULT_LLM_URL).replace(/\/$/, '');
}

// ─── Models ──────────────────────────────────────────────

export interface RemoteModel {
	id: string;
	owned_by: string;
}

/** Fetch the live model list from mana-llm. Returns an empty array on
 *  failure — the caller falls back to the hardcoded PLAYGROUND_MODELS so
 *  the UI never ends up with an empty selector. */
export async function listModels(): Promise<RemoteModel[]> {
	try {
		const res = await fetch(`${llmUrl()}/v1/models`);
		if (!res.ok) return [];
		const payload = (await res.json()) as { data?: RemoteModel[] };
		return payload.data ?? [];
	} catch {
		return [];
	}
}

// ─── Chat completions (streaming) ────────────────────────

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface CompletionOptions {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	signal?: AbortSignal;
}

/** A chunk yielded during streaming — either a content delta or final usage stats. */
export type StreamChunk =
	| { type: 'delta'; content: string }
	| { type: 'usage'; promptTokens: number; completionTokens: number };

/**
 * Streams a chat completion from mana-llm and yields StreamChunks as
 * they arrive. Content deltas have `type: 'delta'`, and the final usage
 * stats (if the provider includes them) have `type: 'usage'`.
 *
 * Errors propagate as thrown exceptions (network failure, non-2xx, abort).
 */
export async function* streamCompletion(opts: CompletionOptions): AsyncGenerator<StreamChunk> {
	const res = await fetch(`${llmUrl()}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal: opts.signal,
		body: JSON.stringify({
			model: opts.model,
			messages: opts.messages,
			temperature: opts.temperature ?? 0.7,
			stream: true,
		}),
	});

	if (!res.ok || !res.body) {
		const text = await res.text().catch(() => '');
		throw new Error(`mana-llm: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
	}

	// Collect chunks via the shared SSE parser, then yield them.
	// We use a queue pattern so the async generator can yield chunks as
	// they arrive from the callback-based consumeSSEStream.
	const chunks: StreamChunk[] = [];
	let resolve: (() => void) | null = null;
	let done = false;

	const streamPromise = consumeSSEStream(
		res.body,
		(content) => {
			chunks.push({ type: 'delta', content });
			resolve?.();
		},
		(usage) => {
			chunks.push({
				type: 'usage',
				promptTokens: usage.promptTokens,
				completionTokens: usage.completionTokens,
			});
			resolve?.();
		}
	).then(() => {
		done = true;
		resolve?.();
	});

	while (!done || chunks.length > 0) {
		if (chunks.length > 0) {
			yield chunks.shift()!;
		} else {
			await new Promise<void>((r) => {
				resolve = r;
			});
		}
	}

	// Ensure the stream promise settles (propagate any errors).
	await streamPromise;
}
