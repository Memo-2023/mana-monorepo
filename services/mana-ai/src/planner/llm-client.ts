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
				const detail = await res.text().catch(() => '');
				throw new Error(`mana-llm ${res.status}: ${detail.slice(0, 500)}`);
			}

			const data = (await res.json()) as ChatCompletionResponseShape;
			const choice = data.choices?.[0];
			if (!choice) throw new Error('mana-llm response had no choices');

			return {
				content: choice.message?.content ?? null,
				toolCalls: (choice.message?.tool_calls ?? []).map(fromWireToolCall),
				finishReason: normaliseFinishReason(choice.finish_reason),
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
