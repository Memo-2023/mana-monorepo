/**
 * Bun-side mana-llm client that conforms to @mana/shared-ai's LlmClient
 * contract. Posts /v1/chat/completions with native tools + tool_calls
 * passthrough; the shared runPlannerLoop drives the multi-turn chat.
 *
 * Unlike the webapp client this one carries a service-key bearer token —
 * mana-llm's api_auth middleware allows it through without a user JWT.
 */

import type {
	ChatMessage,
	LlmClient,
	LlmCompletionRequest,
	LlmCompletionResponse,
	LlmFinishReason,
	ToolCallRequest,
} from '@mana/shared-ai';

/** Thrown when mana-llm returns a non-2xx status. ``kind`` mirrors the
 *  structured ProviderError vocabulary (blocked / truncated / auth /
 *  rate_limit / capability / unknown) so downstream metrics can label
 *  without re-parsing the message. */
export class ProviderCallError extends Error {
	constructor(
		message: string,
		public readonly kind: string
	) {
		super(message);
		this.name = 'ProviderCallError';
	}
}

export interface ServerLlmClientOptions {
	readonly baseUrl: string;
	readonly serviceKey: string;
	readonly defaultModel?: string;
	readonly fetchTimeoutMs?: number;
}

const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const DEFAULT_FETCH_TIMEOUT_MS = 120_000;

export function createServerLlmClient(opts: ServerLlmClientOptions): LlmClient {
	const baseUrl = opts.baseUrl.replace(/\/$/, '');
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
				tools: req.tools,
				tool_choice: 'auto' as const,
				temperature: req.temperature ?? 0.3,
				stream: false,
			};

			let res: Response;
			try {
				res = await fetch(url, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${opts.serviceKey}`,
					},
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
				// mana-llm surfaces structured errors from the provider
				// layer (see services/mana-llm/src/providers/errors.py):
				// `{ detail: { kind, message } }` for 422 / 429 / 502 /
				// 400, plain string detail for everything else. Preserve
				// `kind` on the thrown error so callers (tick metrics)
				// can label provider_errors_total without re-parsing.
				let kind = 'unknown';
				let message = `mana-llm ${res.status}`;
				try {
					const body = (await res.json()) as {
						detail?: string | { kind?: string; message?: string };
					};
					if (typeof body.detail === 'string') {
						message = `${message}: ${body.detail.slice(0, 500)}`;
					} else if (body.detail && typeof body.detail === 'object') {
						kind = body.detail.kind ?? 'unknown';
						message = `${message} (${kind}): ${body.detail.message ?? ''}`;
					}
				} catch {
					// body wasn't JSON — fall back to plain text
					try {
						const text = await res.text();
						if (text) message = `${message}: ${text.slice(0, 500)}`;
					} catch {
						/* already exhausted body stream */
					}
				}
				throw new ProviderCallError(message, kind);
			}

			const data = (await res.json()) as ChatCompletionResponseShape;
			const choice = data.choices?.[0];
			if (!choice) throw new Error('mana-llm response had no choices');

			const usage = data.usage
				? {
						promptTokens: data.usage.prompt_tokens ?? 0,
						completionTokens: data.usage.completion_tokens ?? 0,
						totalTokens:
							data.usage.total_tokens ??
							(data.usage.prompt_tokens ?? 0) + (data.usage.completion_tokens ?? 0),
					}
				: undefined;

			return {
				content: choice.message?.content ?? null,
				toolCalls: (choice.message?.tool_calls ?? []).map(fromWireToolCall),
				finishReason: normaliseFinishReason(choice.finish_reason),
				usage,
			};
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
			function: { name: c.name, arguments: JSON.stringify(c.arguments) },
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
			// Malformed arguments — let the downstream executor reject via schema.
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
