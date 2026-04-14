/**
 * Gemini adapter — direct REST API.
 *
 * Differs from OpenAI:
 *   - API key goes in query string (?key=...)
 *   - Messages use different schema: { role, parts: [{ text }] }
 *   - Roles are 'user' and 'model' (not 'assistant')
 *   - System prompt goes in `systemInstruction` field
 *   - Streaming via SSE at :streamGenerateContent endpoint
 */

import type { ByokProvider, ByokCallOptions } from './types';
import type { GenerateResult, ChatMessage } from '../../types';

export const geminiProvider: ByokProvider = {
	id: 'gemini',
	displayName: 'Google Gemini',
	defaultModel: 'gemini-2.5-flash',
	availableModels: [
		'gemini-2.5-pro',
		'gemini-2.5-flash',
		'gemini-2.5-flash-lite',
		'gemini-2.0-flash',
	],

	async call(opts: ByokCallOptions): Promise<GenerateResult> {
		return callGemini(opts);
	},
};

interface GeminiMessage {
	role: 'user' | 'model';
	parts: { text: string }[];
}

function toGeminiMessages(messages: ChatMessage[]): {
	system?: string;
	contents: GeminiMessage[];
} {
	const systemMessages = messages.filter((m) => m.role === 'system');
	const chatMessages = messages.filter((m) => m.role !== 'system');
	return {
		system: systemMessages.map((m) => m.content).join('\n\n') || undefined,
		contents: chatMessages.map((m) => ({
			role: m.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: m.content }],
		})),
	};
}

async function callGemini(opts: ByokCallOptions): Promise<GenerateResult> {
	const startedAt = Date.now();
	const { system, contents } = toGeminiMessages(opts.messages);

	const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:streamGenerateContent?alt=sse&key=${opts.apiKey}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			systemInstruction: system ? { parts: [{ text: system }] } : undefined,
			contents,
			generationConfig: {
				temperature: opts.temperature ?? 0.7,
				maxOutputTokens: opts.maxTokens ?? 1024,
			},
		}),
	});

	if (!response.ok) {
		const errText = await response.text().catch(() => response.statusText);
		throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 300)}`);
	}

	if (!response.body) {
		throw new Error('Gemini API: kein Response-Body');
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
					candidates?: { content?: { parts?: { text?: string }[] } }[];
					usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
				};
				const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
				if (token) {
					content += token;
					opts.onToken?.(token);
				}
				if (parsed.usageMetadata) {
					promptTokens = parsed.usageMetadata.promptTokenCount ?? promptTokens;
					completionTokens = parsed.usageMetadata.candidatesTokenCount ?? completionTokens;
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
