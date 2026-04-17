/**
 * Perplexity Sonar — chat-completions API with built-in web search.
 * Docs: https://docs.perplexity.ai/api-reference/chat-completions
 *
 * Models (pay-per-use):
 *   sonar                — cheap, fast
 *   sonar-pro            — balanced
 *   sonar-reasoning      — chain-of-thought, deeper answers
 *   sonar-deep-research  — longest/most comprehensive
 */

import type { ResearchAgent } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

const DEFAULT_MODEL = 'sonar';
const ALLOWED_MODELS = new Set(['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-deep-research']);

interface SonarResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	citations?: string[];
	search_results?: Array<{ url: string; title?: string; snippet?: string }>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
	};
}

export function createPerplexitySonarProvider(): ResearchAgent {
	return {
		id: 'perplexity-sonar',
		requiresApiKey: true,
		capabilities: {
			multiStep: true,
			async: false,
			withCitations: true,
		},
		async research(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('perplexity-sonar');
			const t0 = performance.now();

			const model =
				options.model && ALLOWED_MODELS.has(options.model) ? options.model : DEFAULT_MODEL;

			const res = await fetch('https://api.perplexity.ai/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${ctx.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					messages: [
						...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
						{ role: 'user', content: query },
					],
					max_tokens: options.maxTokens ?? 1024,
					temperature: options.temperature ?? 0.2,
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('perplexity-sonar', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as SonarResponse;
			const answer = data.choices?.[0]?.message?.content ?? '';

			const citations =
				data.search_results?.map((r) => ({
					url: r.url,
					title: r.title ?? r.url,
					snippet: r.snippet,
				})) ?? (data.citations ?? []).map((url) => ({ url, title: url }));

			const tokenUsage = data.usage
				? {
						input: data.usage.prompt_tokens ?? 0,
						output: data.usage.completion_tokens ?? 0,
					}
				: undefined;

			return {
				answer: {
					query,
					answer,
					citations,
					tokenUsage,
					providerRaw: data,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
				tokenUsage,
			};
		},
	};
}
