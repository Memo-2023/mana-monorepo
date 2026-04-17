/**
 * OpenAI Responses API with web_search_preview tool.
 * Docs: https://platform.openai.com/docs/guides/tools-web-search
 *
 * Pay-per-use (tokens + per-search fees). No subscription.
 */

import type { Citation, ResearchAgent } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

const DEFAULT_MODEL = 'gpt-4o';

interface ResponsesApiResponse {
	output?: Array<OutputItem>;
	output_text?: string;
	usage?: {
		input_tokens?: number;
		output_tokens?: number;
	};
}

type OutputItem =
	| { type: 'message'; role: string; content: MessageContent[] }
	| { type: 'web_search_call'; id: string; status: string };

type MessageContent = {
	type: 'output_text';
	text: string;
	annotations?: Array<{
		type: string;
		url?: string;
		title?: string;
		start_index?: number;
		end_index?: number;
	}>;
};

export function createOpenAIResponsesProvider(): ResearchAgent {
	return {
		id: 'openai-responses',
		requiresApiKey: true,
		capabilities: {
			multiStep: true,
			async: false,
			withCitations: true,
		},
		async research(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('openai-responses');
			const t0 = performance.now();

			const model = options.model ?? DEFAULT_MODEL;

			const body: Record<string, unknown> = {
				model,
				input: options.systemPrompt
					? [
							{ role: 'system', content: options.systemPrompt },
							{ role: 'user', content: query },
						]
					: query,
				tools: [{ type: 'web_search_preview' }],
				max_output_tokens: options.maxTokens ?? 2048,
			};

			const res = await fetch('https://api.openai.com/v1/responses', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${ctx.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const errBody = await res.text().catch(() => '');
				throw new ProviderError('openai-responses', `HTTP ${res.status} ${errBody.slice(0, 200)}`);
			}

			const data = (await res.json()) as ResponsesApiResponse;

			const textParts: string[] = [];
			const citationsMap = new Map<string, Citation>();

			if (data.output_text) textParts.push(data.output_text);

			for (const item of data.output ?? []) {
				if (item.type !== 'message') continue;
				const msgItem = item as { content: MessageContent[] };
				for (const content of msgItem.content ?? []) {
					if (content.type === 'output_text') {
						if (!data.output_text) textParts.push(content.text);
						for (const ann of content.annotations ?? []) {
							if (ann.url && !citationsMap.has(ann.url)) {
								citationsMap.set(ann.url, {
									url: ann.url,
									title: ann.title ?? ann.url,
								});
							}
						}
					}
				}
			}

			const tokenUsage = data.usage
				? {
						input: data.usage.input_tokens ?? 0,
						output: data.usage.output_tokens ?? 0,
					}
				: undefined;

			return {
				answer: {
					query,
					answer: textParts.join('\n\n'),
					citations: [...citationsMap.values()],
					tokenUsage,
					providerRaw: data,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
				tokenUsage,
			};
		},
	};
}
