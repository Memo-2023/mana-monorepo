/**
 * Playground LLM client — thin wrapper around mana-llm's OpenAI-compatible
 * `/v1/chat/completions` (streaming) and `/v1/models` endpoints.
 *
 * Lives next to the playground UI rather than in a shared package because
 * the playground is the only consumer right now. If chat / todo enrichment
 * / cycles insights end up calling the same surface in the future, lift
 * this into `$lib/data/llm-client.ts`.
 *
 * The chunk parser is hand-rolled rather than pulled from a library: the
 * SSE wire format from mana-llm is straight OpenAI (`data: {…}\n\n` lines
 * with a sentinel `[DONE]`), so a 30-line reader is simpler than a dep.
 */

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

/**
 * Streams a chat completion from mana-llm and yields content deltas as
 * they arrive. The caller concatenates deltas into the visible message —
 * see `routes/(app)/playground/+page.svelte` for the consumer pattern.
 *
 * Errors propagate as thrown exceptions (network failure, non-2xx, abort).
 * The playground page catches them and renders a friendly fallback rather
 * than blanking the conversation.
 */
export async function* streamCompletion(opts: CompletionOptions): AsyncGenerator<string> {
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

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		// SSE frames are separated by blank lines. Process complete frames
		// and leave any partial trailing frame in the buffer for the next
		// chunk.
		let sep: number;
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const frame = buffer.slice(0, sep);
			buffer = buffer.slice(sep + 2);

			for (const line of frame.split('\n')) {
				if (!line.startsWith('data:')) continue;
				const data = line.slice(5).trim();
				if (!data || data === '[DONE]') continue;
				try {
					const json = JSON.parse(data) as {
						choices?: Array<{ delta?: { content?: string } }>;
					};
					const delta = json.choices?.[0]?.delta?.content;
					if (delta) yield delta;
				} catch {
					// Malformed frame — skip silently. mana-llm occasionally
					// emits keepalive comments and we don't want them to
					// crash the stream.
				}
			}
		}
	}
}
