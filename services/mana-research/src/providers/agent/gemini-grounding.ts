/**
 * Gemini with Google Search grounding.
 * Docs: https://ai.google.dev/gemini-api/docs/grounding
 *
 * Pay-per-use (tokens + per-grounding-query fee). No subscription.
 */

import type { Citation, ResearchAgent } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

const DEFAULT_MODEL = 'gemini-2.0-flash';

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{ text?: string }>;
		};
		groundingMetadata?: {
			groundingChunks?: Array<{
				web?: { uri: string; title?: string };
			}>;
			webSearchQueries?: string[];
		};
	}>;
	usageMetadata?: {
		promptTokenCount?: number;
		candidatesTokenCount?: number;
	};
}

export function createGeminiGroundingProvider(): ResearchAgent {
	return {
		id: 'gemini-grounding',
		requiresApiKey: true,
		capabilities: {
			multiStep: false,
			async: false,
			withCitations: true,
		},
		async research(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('gemini-grounding');
			const t0 = performance.now();

			const model = options.model ?? DEFAULT_MODEL;
			const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
				ctx.apiKey
			)}`;

			const contents = [{ role: 'user', parts: [{ text: query }] }];

			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents,
					tools: [{ googleSearch: {} }],
					generationConfig: {
						temperature: options.temperature ?? 0.3,
						maxOutputTokens: options.maxTokens ?? 2048,
					},
					...(options.systemPrompt
						? { systemInstruction: { parts: [{ text: options.systemPrompt }] } }
						: {}),
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('gemini-grounding', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as GeminiResponse;
			const candidate = data.candidates?.[0];
			const answer = (candidate?.content?.parts ?? []).map((p) => p.text ?? '').join('');

			const citationsMap = new Map<string, Citation>();
			for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
				if (chunk.web?.uri && !citationsMap.has(chunk.web.uri)) {
					citationsMap.set(chunk.web.uri, {
						url: chunk.web.uri,
						title: chunk.web.title ?? chunk.web.uri,
					});
				}
			}

			const tokenUsage = data.usageMetadata
				? {
						input: data.usageMetadata.promptTokenCount ?? 0,
						output: data.usageMetadata.candidatesTokenCount ?? 0,
					}
				: undefined;

			return {
				answer: {
					query,
					answer,
					citations: [...citationsMap.values()],
					followUpQueries: candidate?.groundingMetadata?.webSearchQueries,
					tokenUsage,
					providerRaw: data,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
				tokenUsage,
			};
		},
	};
}
