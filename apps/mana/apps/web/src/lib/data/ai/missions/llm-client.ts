/**
 * LlmClient implementation that speaks to the mana-llm service using its
 * OpenAI-compatible /v1/chat/completions endpoint, with native tool_calls
 * passthrough. Used by the webapp Mission Runner and Companion Chat to
 * drive the shared runPlannerLoop from @mana/shared-ai.
 *
 * The shared-ai LlmClient contract is intentionally small — we don't go
 * through the LlmOrchestrator's tier routing here. Tool calling needs
 * a specific server-proxied path (mana-llm forwards to Google / OpenAI
 * / Ollama with tools enabled), not the legacy text-JSON orchestrator.
 * Tier integration can come later once shared-llm grows tool-call
 * awareness.
 */

import {
	type ChatMessage,
	type LlmClient,
	type LlmCompletionRequest,
	type LlmCompletionResponse,
	type LlmFinishReason,
	type ToolCallRequest,
} from '@mana/shared-ai';

const DEFAULT_LLM_URL = 'http://localhost:3025';

/** Resolve the mana-llm base URL from window-injected env; falls back
 *  to localhost. Mirrors the helper in @mana/shared-llm's remote.ts. */
function resolveLlmBaseUrl(): string {
	if (typeof window !== 'undefined') {
		const fromWindow = (window as unknown as { __PUBLIC_MANA_LLM_URL__?: string })
			.__PUBLIC_MANA_LLM_URL__;
		if (fromWindow) return fromWindow.replace(/\/$/, '');
	}
	return DEFAULT_LLM_URL;
}

export interface ManaLlmClientOptions {
	/** Default model id used when callers don't override per request.
	 *  Format matches mana-llm's provider/model syntax. */
	readonly defaultModel?: string;
	/** Override the base URL — mostly for tests. Production resolves from
	 *  window.__PUBLIC_MANA_LLM_URL__. */
	readonly baseUrl?: string;
	/** Hard stop for the fetch. The runner wraps runPlannerLoop in its
	 *  own iteration-level timeout (180 s) so this is mostly a belt +
	 *  braces for pathological provider stalls. */
	readonly fetchTimeoutMs?: number;
}

const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const DEFAULT_FETCH_TIMEOUT_MS = 120_000;

export function createManaLlmClient(opts: ManaLlmClientOptions = {}): LlmClient {
	const baseUrl = (opts.baseUrl ?? resolveLlmBaseUrl()).replace(/\/$/, '');
	const defaultModel = opts.defaultModel ?? DEFAULT_MODEL;
	const fetchTimeoutMs = opts.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;

	return {
		async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
			const url = `${baseUrl}/v1/chat/completions`;
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

			const body = {
				model: req.model || defaultModel,
				messages: req.messages.map(toWireMessage),
				tools: req.tools, // already in OpenAI {type, function} shape
				tool_choice: 'auto' as const,
				temperature: req.temperature ?? 0.3,
				stream: false,
			};

			let res: Response;
			try {
				res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
					signal: controller.signal,
				});
			} catch (err) {
				clearTimeout(timeout);
				const msg = err instanceof Error ? err.message : String(err);
				throw new Error(`mana-llm unreachable at ${baseUrl}: ${msg}`);
			}
			clearTimeout(timeout);

			if (!res.ok) {
				let detail: unknown;
				try {
					detail = await res.json();
				} catch {
					detail = await res.text().catch(() => '');
				}
				throw new Error(
					`mana-llm ${res.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
				);
			}

			const data = (await res.json()) as ChatCompletionResponseShape;
			const choice = data.choices?.[0];
			if (!choice) {
				throw new Error('mana-llm response had no choices');
			}
			const content = choice.message?.content ?? null;
			const toolCalls = (choice.message?.tool_calls ?? []).map(fromWireToolCall);
			const finishReason = normaliseFinishReason(choice.finish_reason);
			const usage = data.usage
				? {
						promptTokens: data.usage.prompt_tokens ?? 0,
						completionTokens: data.usage.completion_tokens ?? 0,
						totalTokens:
							data.usage.total_tokens ??
							(data.usage.prompt_tokens ?? 0) + (data.usage.completion_tokens ?? 0),
					}
				: undefined;

			return { content, toolCalls, finishReason, usage };
		},
	};
}

// ── Wire-format helpers ─────────────────────────────────────────────

interface WireMessage {
	role: 'system' | 'user' | 'assistant' | 'tool';
	content?: string | null;
	tool_calls?: Array<{
		id: string;
		type: 'function';
		function: { name: string; arguments: string };
	}>;
	tool_call_id?: string;
}

function toWireMessage(m: ChatMessage): WireMessage {
	const out: WireMessage = { role: m.role };
	if (m.content !== undefined) out.content = m.content;
	if (m.toolCallId) out.tool_call_id = m.toolCallId;
	if (m.toolCalls && m.toolCalls.length > 0) {
		out.tool_calls = m.toolCalls.map((c) => ({
			id: c.id,
			type: 'function',
			function: {
				name: c.name,
				arguments: JSON.stringify(c.arguments),
			},
		}));
	}
	return out;
}

interface ChatCompletionResponseShape {
	choices?: Array<{
		message?: {
			content?: string | null;
			tool_calls?: Array<{
				id: string;
				type?: string;
				function: { name: string; arguments?: string };
			}>;
		};
		finish_reason?: string | null;
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

function fromWireToolCall(raw: {
	id: string;
	function: { name: string; arguments?: string };
}): ToolCallRequest {
	let args: Record<string, unknown> = {};
	if (raw.function.arguments) {
		try {
			const parsed = JSON.parse(raw.function.arguments);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				args = parsed as Record<string, unknown>;
			}
		} catch {
			// Malformed arguments — surface as empty and let the executor
			// reject on the missing-required-parameter path.
		}
	}
	return { id: raw.id, name: raw.function.name, arguments: args };
}

function normaliseFinishReason(raw: string | null | undefined): LlmFinishReason {
	switch (raw) {
		case 'tool_calls':
			return 'tool_calls';
		case 'length':
			return 'length';
		case 'content_filter':
			return 'content_filter';
		case 'stop':
		default:
			return 'stop';
	}
}
