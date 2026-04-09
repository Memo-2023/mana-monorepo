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
 * Send a chat completion to mana-llm and return the result.
 *
 * Implementation notes:
 *
 * - We use the NON-streaming endpoint (`stream: false`). Curl tests
 *   from the same hostname showed that mana-llm's streaming endpoint
 *   works perfectly when called from outside the browser, but the
 *   browser receives `totalFrames=0` (an empty response body) for
 *   reasons that almost certainly trace back to CORS + credentials
 *   + streaming-body interactions. Non-streaming is a single JSON
 *   response, much friendlier to the browser fetch API.
 *
 * - We do NOT pass `credentials: 'include'`. The mana-llm service
 *   doesn't require user auth (the API key middleware accepts
 *   anonymous requests), and `credentials: 'include'` plus
 *   `Access-Control-Allow-Origin: *` is one of the patterns that
 *   silently breaks the response body in browsers. Verified by
 *   comparing curl-from-server (no creds, works) vs browser fetch
 *   (with creds, empty body).
 *
 * - For tasks that registered an `onToken` callback (legacy chat-
 *   style streaming UX), we fire it ONCE with the full content at
 *   the end. That's a degraded streaming experience, but no current
 *   shared-llm caller actually consumes the per-token stream — the
 *   queue + watcher model only cares about the final result. The
 *   playground module uses its own client (apps/.../modules/
 *   playground/llm.ts) which keeps real streaming for live UX.
 *
 * `tier` is only used for error tagging — both 'mana-server' and
 * 'cloud' call the same endpoint with different model strings.
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
			body: JSON.stringify({
				model,
				messages: req.messages,
				temperature: req.temperature ?? 0.7,
				max_tokens: req.maxTokens ?? 1024,
				stream: false,
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

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		// 451 = upstream blocked content (we use this convention; Gemini
		// safety blocks are mapped to 451 in mana-llm's google provider).
		if (res.status === 451 || /safety|blocked|filter/i.test(text)) {
			throw new ProviderBlockedError(tier, text || `HTTP ${res.status}`);
		}
		throw new BackendUnreachableError(tier, res.status, text);
	}

	let json: {
		choices?: Array<{
			message?: { content?: string; reasoning?: string };
			text?: string;
		}>;
		usage?: { prompt_tokens?: number; completion_tokens?: number };
	};
	try {
		json = await res.json();
	} catch (err) {
		console.warn(`[shared-llm:${tier}] failed to parse response JSON`, err);
		throw new BackendUnreachableError(tier, res.status, 'invalid JSON response');
	}

	// Field ordering: prefer the canonical OpenAI `message.content` first.
	// If that's empty AND `message.reasoning` is set, fall back to it —
	// reasoning models like Gemma 4 emit their thought process there
	// when given too few tokens to also produce a final answer (we hit
	// this with max_tokens=10 / no system prompt: content was "" while
	// reasoning had the half-finished thought). For our title task this
	// rarely happens because the system prompt is directive, but the
	// fallback is cheap and protects against future tasks that might
	// trigger longer reasoning chains.
	const choice = json.choices?.[0];
	const content = choice?.message?.content ?? choice?.message?.reasoning ?? choice?.text ?? '';

	if (!content) {
		console.warn(`[shared-llm:${tier}] empty completion content`, { model, json });
	}

	// One-shot "streaming" for any caller that registered onToken: emit
	// the whole content as a single chunk at the end. The current
	// orchestrator + queue model never reads tokens incrementally for
	// remote tiers anyway.
	if (content && req.onToken) {
		req.onToken(content);
	}

	return {
		content,
		usage: {
			promptTokens: json.usage?.prompt_tokens ?? 0,
			completionTokens: json.usage?.completion_tokens ?? 0,
			totalTokens: (json.usage?.prompt_tokens ?? 0) + (json.usage?.completion_tokens ?? 0),
		},
		latencyMs: Math.round(performance.now() - start),
	};
}
