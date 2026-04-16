/**
 * Shared HTTP transport for the mana-server and cloud backends.
 *
 * Both tiers POST to the same OpenAI-compatible endpoint on
 * services/mana-llm — they only differ in the `model:` string they
 * send (which selects which provider mana-llm internally routes to).
 *
 * The endpoint is `/v1/chat/completions` and the wire format is
 * straight OpenAI SSE: `data: {…}\n\n` lines, terminated by
 * `data: [DONE]`. The SSE parser lives in `../sse-parser.ts` and is
 * shared with the playground client.
 */

import { BackendUnreachableError, ProviderBlockedError } from '../errors';
import { consumeSSEStream } from '../sse-parser';
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
 * When `req.onToken` is set, uses SSE streaming (`stream: true`) so
 * the caller receives per-token callbacks as they arrive — used by the
 * Mission Runner to show live progress during the "calling-llm" phase.
 *
 * When `req.onToken` is absent, uses the non-streaming endpoint
 * (`stream: false`) which returns a single JSON response — simpler and
 * sufficient for tasks that only care about the final result.
 *
 * We do NOT pass `credentials: 'include'` — the mana-llm service
 * accepts anonymous requests, and `credentials: 'include'` plus
 * `Access-Control-Allow-Origin: *` silently breaks the response body
 * in browsers (verified by comparing curl vs browser fetch). The
 * playground module uses the same no-credentials pattern with
 * `stream: true` and it works fine.
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
	const useStreaming = typeof req.onToken === 'function';

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
				stream: useStreaming,
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

	// ── Streaming path: SSE with per-token callbacks ───────────
	if (useStreaming && res.body) {
		let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
		const content = await consumeSSEStream(res.body, req.onToken, (u) => {
			usage = {
				promptTokens: u.promptTokens,
				completionTokens: u.completionTokens,
				totalTokens: u.promptTokens + u.completionTokens,
			};
		});

		if (!content) {
			console.warn(`[shared-llm:${tier}] empty streaming content`, { model });
		}

		return { content, usage, latencyMs: Math.round(performance.now() - start) };
	}

	// ── Non-streaming path: single JSON response ──────────────
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
	// when given too few tokens to also produce a final answer.
	const choice = json.choices?.[0];
	const content = choice?.message?.content ?? choice?.message?.reasoning ?? choice?.text ?? '';

	if (!content) {
		console.warn(`[shared-llm:${tier}] empty completion content`, { model, json });
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
