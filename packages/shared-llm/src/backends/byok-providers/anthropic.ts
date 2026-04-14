/**
 * Anthropic adapter.
 *
 * Differs from OpenAI:
 *   - Uses x-api-key header (not Bearer)
 *   - Needs anthropic-version header
 *   - Needs anthropic-dangerous-direct-browser-access for CORS
 *   - System prompt goes in its own `system` field, not as a message
 *   - SSE event schema is different (content_block_delta with text)
 */

import type { ByokProvider, ByokCallOptions } from './types';
import type { GenerateResult } from '../../types';

export const anthropicProvider: ByokProvider = {
	id: 'anthropic',
	displayName: 'Anthropic',
	defaultModel: 'claude-sonnet-4-5',
	availableModels: [
		'claude-opus-4-6',
		'claude-opus-4-5',
		'claude-sonnet-4-6',
		'claude-sonnet-4-5',
		'claude-haiku-4-5',
	],

	async call(opts: ByokCallOptions): Promise<GenerateResult> {
		return callAnthropic(opts);
	},
};

async function callAnthropic(opts: ByokCallOptions): Promise<GenerateResult> {
	const startedAt = Date.now();

	// Anthropic wants system prompt separately, user/assistant inline
	const systemMessages = opts.messages.filter((m) => m.role === 'system');
	const chatMessages = opts.messages.filter((m) => m.role !== 'system');
	const system = systemMessages.map((m) => m.content).join('\n\n') || undefined;

	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': opts.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true',
		},
		body: JSON.stringify({
			model: opts.model,
			system,
			messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
			temperature: opts.temperature ?? 0.7,
			max_tokens: opts.maxTokens ?? 1024,
			stream: true,
		}),
	});

	if (!response.ok) {
		const errText = await response.text().catch(() => response.statusText);
		throw new Error(`Anthropic API ${response.status}: ${errText.slice(0, 300)}`);
	}

	if (!response.body) {
		throw new Error('Anthropic API: kein Response-Body');
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
			if (!payload) continue;

			try {
				const parsed = JSON.parse(payload) as {
					type?: string;
					delta?: { type?: string; text?: string };
					message?: { usage?: { input_tokens?: number; output_tokens?: number } };
					usage?: { input_tokens?: number; output_tokens?: number };
				};

				if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
					const token = parsed.delta.text ?? '';
					if (token) {
						content += token;
						opts.onToken?.(token);
					}
				} else if (parsed.type === 'message_start' && parsed.message?.usage) {
					promptTokens = parsed.message.usage.input_tokens ?? 0;
				} else if (parsed.type === 'message_delta' && parsed.usage) {
					completionTokens = parsed.usage.output_tokens ?? completionTokens;
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
