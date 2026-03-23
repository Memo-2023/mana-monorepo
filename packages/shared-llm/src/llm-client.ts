/**
 * Framework-agnostic LLM client that communicates with the mana-llm service.
 *
 * This is the core implementation shared between the NestJS LlmClientService
 * and the standalone LlmClient export (for non-NestJS consumers like bot-services).
 */

import type { ResolvedLlmOptions } from './interfaces/llm-options.interface';
import type {
	ChatMessage,
	ChatOptions,
	ChatResult,
	JsonOptions,
	JsonResult,
	VisionOptions,
	TokenUsage,
	ModelInfo,
	HealthStatus,
} from './types/chat.types';
import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	EmbeddingResponse,
} from './types/openai-compat.types';
import { extractJson } from './utils/json-extractor';
import { retryFetch } from './utils/retry';

function createTimeoutSignal(ms: number): any {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), ms);
	return controller.signal;
}

export class LlmClient {
	private readonly baseUrl: string;
	private readonly options: ResolvedLlmOptions;

	constructor(options: ResolvedLlmOptions) {
		this.options = options;
		this.baseUrl = options.manaLlmUrl.replace(/\/+$/, '');
	}

	// ---------------------------------------------------------------------------
	// Text Chat
	// ---------------------------------------------------------------------------

	/** Simple chat with a single prompt string. */
	async chat(prompt: string, opts?: ChatOptions): Promise<ChatResult> {
		const messages = this.buildMessages(prompt, opts?.systemPrompt);
		return this.chatMessages(messages, opts);
	}

	/** Chat with full message history. */
	async chatMessages(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult> {
		const body = this.buildRequest(messages, opts, false);
		const start = Date.now();
		const response = await this.fetchCompletion(body, opts?.timeout);
		const latencyMs = Date.now() - start;

		return {
			content: response.choices[0]?.message?.content ?? '',
			model: response.model,
			usage: response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
			latencyMs,
		};
	}

	// ---------------------------------------------------------------------------
	// Streaming
	// ---------------------------------------------------------------------------

	/** Streaming chat - returns an async iterable of text tokens. */
	async *chatStream(prompt: string, opts?: ChatOptions): AsyncIterable<string> {
		const messages = this.buildMessages(prompt, opts?.systemPrompt);
		yield* this.chatStreamMessages(messages, opts);
	}

	/** Streaming chat with full message history. */
	async *chatStreamMessages(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string> {
		const body = this.buildRequest(messages, opts, true);
		const timeout = opts?.timeout ?? this.options.timeout;

		const response = await retryFetch(
			`${this.baseUrl}/v1/chat/completions`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: createTimeoutSignal(timeout),
			},
			{ maxRetries: this.options.maxRetries }
		);

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(`mana-llm stream error ${response.status}: ${text}`);
		}

		if (!response.body) {
			throw new Error('mana-llm returned no response body for stream');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || !trimmed.startsWith('data: ')) continue;

					const data = trimmed.slice(6);
					if (data === '[DONE]') return;

					try {
						const chunk = JSON.parse(data);
						const content = chunk.choices?.[0]?.delta?.content;
						if (content) yield content;
					} catch {
						// Skip unparseable chunks
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	// ---------------------------------------------------------------------------
	// Structured JSON Output
	// ---------------------------------------------------------------------------

	/** Chat that extracts and parses JSON from the response. */
	async json<T = unknown>(prompt: string, opts?: JsonOptions<T>): Promise<JsonResult<T>> {
		const messages = this.buildMessages(prompt, opts?.systemPrompt);
		return this.jsonMessages<T>(messages, opts);
	}

	/** JSON extraction from full message history. */
	async jsonMessages<T = unknown>(
		messages: ChatMessage[],
		opts?: JsonOptions<T>
	): Promise<JsonResult<T>> {
		const maxAttempts = (opts?.jsonRetries ?? 1) + 1;
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const result = await this.chatMessages(messages, opts);

			try {
				const data = extractJson<T>(result.content, opts?.validate);
				return { ...result, data };
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (this.options.debug) {
					console.warn(
						`[shared-llm] JSON extraction attempt ${attempt + 1}/${maxAttempts} failed:`,
						lastError.message
					);
				}
			}
		}

		throw lastError ?? new Error('JSON extraction failed');
	}

	// ---------------------------------------------------------------------------
	// Vision
	// ---------------------------------------------------------------------------

	/** Analyze an image with a text prompt. */
	async vision(
		prompt: string,
		imageBase64: string,
		mimeType?: string,
		opts?: VisionOptions
	): Promise<ChatResult> {
		const messages = this.buildVisionMessages(prompt, imageBase64, mimeType, opts?.systemPrompt);
		const model = opts?.visionModel ?? this.options.defaultVisionModel;
		return this.chatMessages(messages, { ...opts, model });
	}

	/** Vision + JSON extraction. */
	async visionJson<T = unknown>(
		prompt: string,
		imageBase64: string,
		mimeType?: string,
		opts?: VisionOptions & JsonOptions<T>
	): Promise<JsonResult<T>> {
		const messages = this.buildVisionMessages(prompt, imageBase64, mimeType, opts?.systemPrompt);
		const model = opts?.visionModel ?? this.options.defaultVisionModel;
		return this.jsonMessages<T>(messages, { ...opts, model });
	}

	// ---------------------------------------------------------------------------
	// Embeddings
	// ---------------------------------------------------------------------------

	/** Generate embeddings for text input. */
	async embed(
		input: string | string[],
		model?: string
	): Promise<{ embeddings: number[][]; usage: TokenUsage }> {
		const response = await retryFetch(
			`${this.baseUrl}/v1/embeddings`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: model ?? this.options.defaultModel,
					input,
				}),
				signal: createTimeoutSignal(this.options.timeout),
			},
			{ maxRetries: this.options.maxRetries }
		);

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(`mana-llm embeddings error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as EmbeddingResponse;
		return {
			embeddings: data.data.map((d) => d.embedding),
			usage: data.usage,
		};
	}

	// ---------------------------------------------------------------------------
	// Health & Models
	// ---------------------------------------------------------------------------

	/** Check mana-llm health and provider status. */
	async health(): Promise<HealthStatus> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: createTimeoutSignal(5_000),
			});
			if (!response.ok) {
				return { status: 'unhealthy', providers: {} };
			}
			return (await response.json()) as HealthStatus;
		} catch {
			return { status: 'unhealthy', providers: {} };
		}
	}

	/** List available models from all providers. */
	async listModels(): Promise<ModelInfo[]> {
		const response = await fetch(`${this.baseUrl}/v1/models`, {
			signal: createTimeoutSignal(10_000),
		});

		if (!response.ok) {
			throw new Error(`mana-llm models error ${response.status}`);
		}

		const data = (await response.json()) as { data: ModelInfo[] };
		return data.data ?? [];
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private buildMessages(prompt: string, systemPrompt?: string): ChatMessage[] {
		const messages: ChatMessage[] = [];
		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({ role: 'user', content: prompt });
		return messages;
	}

	private buildVisionMessages(
		prompt: string,
		imageBase64: string,
		mimeType?: string,
		systemPrompt?: string
	): ChatMessage[] {
		const mime = mimeType ?? 'image/jpeg';
		const dataUrl = imageBase64.startsWith('data:')
			? imageBase64
			: `data:${mime};base64,${imageBase64}`;

		const messages: ChatMessage[] = [];
		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({
			role: 'user',
			content: [
				{ type: 'text', text: prompt },
				{ type: 'image_url', image_url: { url: dataUrl } },
			],
		});
		return messages;
	}

	private buildRequest(
		messages: ChatMessage[],
		opts: ChatOptions | undefined,
		stream: boolean
	): ChatCompletionRequest {
		const request: ChatCompletionRequest = {
			model: opts?.model ?? this.options.defaultModel,
			messages,
			stream,
		};

		if (opts?.temperature !== undefined) request.temperature = opts.temperature;
		if (opts?.maxTokens !== undefined) request.max_tokens = opts.maxTokens;

		return request;
	}

	private async fetchCompletion(
		body: ChatCompletionRequest,
		timeoutOverride?: number
	): Promise<ChatCompletionResponse> {
		const timeout = timeoutOverride ?? this.options.timeout;

		const response = await retryFetch(
			`${this.baseUrl}/v1/chat/completions`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: createTimeoutSignal(timeout),
			},
			{ maxRetries: this.options.maxRetries }
		);

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(`mana-llm error ${response.status}: ${text}`);
		}

		return (await response.json()) as ChatCompletionResponse;
	}
}
