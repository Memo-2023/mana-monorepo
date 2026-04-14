/**
 * OpenAI-compatible API adapter (base for OpenAI, Mistral, Groq, etc.)
 *
 * Uses the ChatCompletions API schema. Streaming via SSE, parsing
 * the `data: {json}` lines, extracting `choices[0].delta.content`.
 */

import type { GenerateResult } from '../../types';
import type { ByokCallOptions } from './types';

export interface OpenAiCompatConfig {
	baseUrl: string;
	providerName: string; // For error messages
	extraHeaders?: Record<string, string>;
}

export async function callOpenAiCompat(
	config: OpenAiCompatConfig,
	opts: ByokCallOptions
): Promise<GenerateResult> {
	const startedAt = Date.now();
	const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${opts.apiKey}`,
			...(config.extraHeaders ?? {}),
		},
		body: JSON.stringify({
			model: opts.model,
			messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
			temperature: opts.temperature ?? 0.7,
			max_tokens: opts.maxTokens ?? 1024,
			stream: true,
			stream_options: { include_usage: true },
		}),
	});

	if (!response.ok) {
		const errText = await response.text().catch(() => response.statusText);
		const short = errText.slice(0, 300);
		throw new Error(`${config.providerName} API ${response.status}: ${short}`);
	}

	if (!response.body) {
		throw new Error(`${config.providerName} API: kein Response-Body`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let content = '';
	let promptTokens = 0;
	let completionTokens = 0;

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		let newlineIdx: number;
		while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
			const line = buffer.slice(0, newlineIdx).trim();
			buffer = buffer.slice(newlineIdx + 1);

			if (!line.startsWith('data: ')) continue;
			const payload = line.slice(6).trim();
			if (payload === '[DONE]') continue;

			try {
				const parsed = JSON.parse(payload) as {
					choices?: { delta?: { content?: string } }[];
					usage?: { prompt_tokens?: number; completion_tokens?: number };
				};
				const token = parsed.choices?.[0]?.delta?.content ?? '';
				if (token) {
					content += token;
					opts.onToken?.(token);
				}
				if (parsed.usage) {
					promptTokens = parsed.usage.prompt_tokens ?? 0;
					completionTokens = parsed.usage.completion_tokens ?? 0;
				}
			} catch {
				// Ignore malformed lines
			}
		}
	}

	return {
		content,
		usage: {
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
		},
		latencyMs: Date.now() - startedAt,
	};
}
