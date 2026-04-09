/**
 * Shared HTTP transport for the mana-server and cloud backends.
 *
 * Both tiers POST to the same OpenAI-compatible endpoint on
 * services/mana-llm — they only differ in the `model:` string they
 * send (which selects which provider mana-llm internally routes to).
 *
 * The endpoint is `/v1/chat/completions` and the wire format is
 * straight OpenAI SSE: `data: {…}\n\n` lines, terminated by
 * `data: [DONE]`. The hand-rolled parser is the same shape as the
 * existing playground client (apps/mana/apps/web/src/lib/modules/
 * playground/llm.ts) so the two consumers stay aligned and can be
 * unified later if we want.
 */

import { BackendUnreachableError, ProviderBlockedError } from '../errors';
import type { LlmTier } from '../tiers';
import type { GenerateResult, LlmTaskRequest } from '../types';

const DEFAULT_LLM_URL = 'http://localhost:3025';

/** Resolve the mana-llm base URL from the window-injected env, falling
 *  back to localhost. Mirrors the playground client pattern. */
export function resolveLlmBaseUrl(): string {
	if (typeof window !== 'undefined') {
		const fromWindow = (window as unknown as { __PUBLIC_MANA_LLM_URL__?: string })
			.__PUBLIC_MANA_LLM_URL__;
		if (fromWindow) return fromWindow.replace(/\/$/, '');
	}
	return DEFAULT_LLM_URL;
}

/**
 * Send a chat completion to mana-llm and yield streaming token deltas.
 * The caller is responsible for assembling the final string and tracking
 * latency.
 *
 * `tier` is only used for error tagging — both 'mana-server' and 'cloud'
 * call the same endpoint with different model strings.
 */
export async function callManaLlmStreaming(
	tier: Exclude<LlmTier, 'none' | 'browser'>,
	model: string,
	req: LlmTaskRequest
): Promise<GenerateResult> {
	const url = `${resolveLlmBaseUrl()}/v1/chat/completions`;
	const start = performance.now();

	let res: Response;
	try {
		res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', // forwards the Mana auth cookie if present
			body: JSON.stringify({
				model,
				messages: req.messages,
				temperature: req.temperature ?? 0.7,
				max_tokens: req.maxTokens ?? 1024,
				stream: true,
			}),
		});
	} catch (err) {
		// Network failure — DNS, refused connection, CORS preflight, etc.
		throw new BackendUnreachableError(
			tier,
			undefined,
			err instanceof Error ? err.message : String(err)
		);
	}

	if (!res.ok || !res.body) {
		const text = await res.text().catch(() => '');
		// 451 = upstream blocked content (we use this convention; Gemini
		// safety blocks are mapped to 451 in mana-llm's google provider).
		// Other 4xx/5xx are generic server errors.
		if (res.status === 451 || /safety|blocked|filter/i.test(text)) {
			throw new ProviderBlockedError(tier, text || `HTTP ${res.status}`);
		}
		throw new BackendUnreachableError(tier, res.status, text);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let collected = '';
	let promptTokens = 0;
	let completionTokens = 0;

	// Diagnostic counters — logged once at the end if `collected` is
	// empty so we can see whether the empty result is "no frames at
	// all", "frames with a different shape", or "frames with empty
	// content fields". Without this we'd have to add a network sniffer
	// to debug remote-tier title failures.
	let totalFrames = 0;
	let dataFrames = 0;
	let firstFrameRaw: string | null = null;
	let firstFrameParsed: unknown = null;

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		// SSE frames are separated by blank lines.
		let sep: number;
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const frame = buffer.slice(0, sep);
			buffer = buffer.slice(sep + 2);
			totalFrames++;

			for (const line of frame.split('\n')) {
				if (!line.startsWith('data:')) continue;
				const data = line.slice(5).trim();
				if (!data || data === '[DONE]') continue;
				dataFrames++;
				if (firstFrameRaw === null) firstFrameRaw = data;
				try {
					const json = JSON.parse(data) as {
						choices?: Array<{
							delta?: { content?: string; text?: string };
							message?: { content?: string };
							text?: string;
						}>;
						usage?: { prompt_tokens?: number; completion_tokens?: number };
					};
					if (firstFrameParsed === null) firstFrameParsed = json;

					// Be liberal in what we accept: OpenAI uses delta.content,
					// some Ollama-compat shims use delta.text or text or
					// message.content. Pick whichever shows up.
					const choice = json.choices?.[0];
					const delta =
						choice?.delta?.content ??
						choice?.delta?.text ??
						choice?.message?.content ??
						choice?.text ??
						'';
					if (delta) {
						collected += delta;
						req.onToken?.(delta);
					}
					if (json.usage) {
						promptTokens = json.usage.prompt_tokens ?? promptTokens;
						completionTokens = json.usage.completion_tokens ?? completionTokens;
					}
				} catch {
					// Malformed frame — keepalive comment, skip silently.
				}
			}
		}
	}

	// Empty-result diagnostic dump. Only fires when something went
	// wrong, so it's quiet in the happy path.
	if (!collected) {
		console.warn(
			`[shared-llm:${tier}] empty completion — totalFrames=${totalFrames}, dataFrames=${dataFrames}`,
			{
				model,
				firstFrameRaw,
				firstFrameParsed,
			}
		);
	}

	return {
		content: collected,
		usage: {
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
		},
		latencyMs: Math.round(performance.now() - start),
	};
}
