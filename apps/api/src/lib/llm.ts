/**
 * Thin client for the mana-llm gateway.
 *
 * Two helpers, deliberately small:
 *
 *   llmJson()    — non-streaming, parses the model response as JSON.
 *                  Used for plan/structuring steps where we need a typed object.
 *
 *   llmStream()  — streaming, calls onToken() for each delta and returns
 *                  the full concatenated text at the end. Used for synthesis.
 *
 * mana-llm exposes an OpenAI-compatible /v1/chat/completions endpoint
 * (see services/mana-llm). Models are namespaced as `provider/model`, e.g.
 * `ollama/gemma3:4b`, `openrouter/meta-llama/llama-3.1-70b-instruct`.
 *
 * Internal service-to-service calls — no auth on the wire (private network).
 */

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';

export interface LlmMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface LlmJsonOptions {
	model: string;
	system?: string;
	user: string;
	temperature?: number;
	maxTokens?: number;
}

export interface LlmTextOptions {
	model: string;
	system?: string;
	user: string;
	temperature?: number;
	maxTokens?: number;
	signal?: AbortSignal;
}

export interface LlmStreamOptions {
	model: string;
	system?: string;
	user: string;
	temperature?: number;
	maxTokens?: number;
	onToken: (delta: string) => void | Promise<void>;
	signal?: AbortSignal;
}

export class LlmError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
		public readonly body?: string
	) {
		super(message);
		this.name = 'LlmError';
	}
}

function buildMessages(system: string | undefined, user: string): LlmMessage[] {
	const msgs: LlmMessage[] = [];
	if (system) msgs.push({ role: 'system', content: system });
	msgs.push({ role: 'user', content: user });
	return msgs;
}

/**
 * Call the LLM and parse the response as JSON.
 *
 * Strips markdown code fences if the model wraps its output in ```json ... ```.
 * Throws LlmError on transport/HTTP failure or if the body isn't valid JSON.
 */
export async function llmJson<T = unknown>(opts: LlmJsonOptions): Promise<T> {
	const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: opts.model,
			messages: buildMessages(opts.system, opts.user),
			temperature: opts.temperature ?? 0.2,
			max_tokens: opts.maxTokens ?? 1000,
			response_format: { type: 'json_object' },
		}),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new LlmError(`mana-llm returned ${res.status}`, res.status, body);
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const raw = data.choices?.[0]?.message?.content;
	if (!raw) throw new LlmError('mana-llm response missing content');

	const cleaned = stripCodeFence(raw);
	try {
		return JSON.parse(cleaned) as T;
	} catch (err) {
		throw new LlmError(
			`mana-llm returned non-JSON content: ${(err as Error).message}`,
			undefined,
			raw
		);
	}
}

/**
 * Call the LLM and return the raw text content — no JSON parsing, no
 * streaming. Used when you want a finished prose artifact (a generated
 * draft, a summary, a translation) as one string. Includes token usage
 * when the provider reports it so generation records can store it.
 */
export interface LlmTextResult {
	text: string;
	tokenUsage?: { input: number; output: number };
	model: string;
}

export async function llmText(opts: LlmTextOptions): Promise<LlmTextResult> {
	const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: opts.model,
			messages: buildMessages(opts.system, opts.user),
			temperature: opts.temperature ?? 0.7,
			max_tokens: opts.maxTokens ?? 2000,
		}),
		signal: opts.signal,
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new LlmError(`mana-llm returned ${res.status}`, res.status, body);
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
		usage?: { prompt_tokens?: number; completion_tokens?: number };
		model?: string;
	};
	const text = data.choices?.[0]?.message?.content;
	if (!text) throw new LlmError('mana-llm response missing content');
	return {
		text: text.trim(),
		tokenUsage:
			data.usage && typeof data.usage.prompt_tokens === 'number'
				? {
						input: data.usage.prompt_tokens ?? 0,
						output: data.usage.completion_tokens ?? 0,
					}
				: undefined,
		model: data.model ?? opts.model,
	};
}

/**
 * Call the LLM in streaming mode. Invokes onToken() for each delta and
 * returns the full concatenated text once the stream completes.
 *
 * Parses OpenAI-style SSE: lines beginning with `data: ` and the
 * sentinel `data: [DONE]`.
 */
export async function llmStream(opts: LlmStreamOptions): Promise<string> {
	const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: opts.model,
			messages: buildMessages(opts.system, opts.user),
			temperature: opts.temperature ?? 0.5,
			max_tokens: opts.maxTokens ?? 2000,
			stream: true,
		}),
		signal: opts.signal,
	});

	if (!res.ok || !res.body) {
		const body = await res.text().catch(() => '');
		throw new LlmError(`mana-llm stream returned ${res.status}`, res.status, body);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let full = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });

		// SSE frames are separated by blank lines, but mana-llm forwards
		// line-by-line — split on \n and keep the last (possibly partial) line.
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';

		for (const line of lines) {
			if (!line.startsWith('data: ')) continue;
			const payload = line.slice(6).trim();
			if (!payload || payload === '[DONE]') continue;

			try {
				const chunk = JSON.parse(payload) as {
					choices?: Array<{ delta?: { content?: string } }>;
				};
				const delta = chunk.choices?.[0]?.delta?.content;
				if (delta) {
					full += delta;
					await opts.onToken(delta);
				}
			} catch {
				// ignore malformed frames — keepalives, comments, etc.
			}
		}
	}

	return full;
}

function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	if (!trimmed.startsWith('```')) return trimmed;
	// ```json\n...\n``` or ```\n...\n```
	const withoutOpen = trimmed.replace(/^```(?:json)?\s*\n?/, '');
	return withoutOpen.replace(/\n?```\s*$/, '');
}
