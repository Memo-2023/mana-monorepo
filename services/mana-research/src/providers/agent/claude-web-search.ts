/**
 * Claude with server-side web_search tool.
 * Docs: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-search-tool
 *
 * Anthropic charges per tool invocation + tokens. No subscription.
 */

import type { ResearchAgent, Citation } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

const DEFAULT_MODEL = 'claude-opus-4-7';
const DEFAULT_MAX_SEARCHES = 5;

type ContentBlock =
	| { type: 'text'; text: string; citations?: CitationBlock[] }
	| { type: 'tool_use'; id: string; name: string; input: unknown }
	| { type: 'server_tool_use'; id: string; name: string; input: unknown }
	| { type: 'web_search_tool_result'; tool_use_id: string; content: WebSearchResult[] };

interface CitationBlock {
	type: 'web_search_result_location';
	url?: string;
	title?: string;
	cited_text?: string;
}

interface WebSearchResult {
	type: 'web_search_result';
	url: string;
	title: string;
	page_age?: string;
	encrypted_content?: string;
}

interface AnthropicResponse {
	content?: ContentBlock[];
	usage?: {
		input_tokens?: number;
		output_tokens?: number;
	};
}

export function createClaudeWebSearchProvider(): ResearchAgent {
	return {
		id: 'claude-web-search',
		requiresApiKey: true,
		capabilities: {
			multiStep: true,
			async: false,
			withCitations: true,
		},
		async research(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('claude-web-search');
			const t0 = performance.now();

			const model = options.model ?? DEFAULT_MODEL;

			// Claude Opus 4.7 deprecated the `temperature` param; only set it
			// when the caller explicitly asked for one (older Sonnet/Haiku
			// accept it but Opus 4.7 rejects with 400 invalid_request_error).
			const body: Record<string, unknown> = {
				model,
				max_tokens: options.maxTokens ?? 2048,
				system: options.systemPrompt,
				messages: [{ role: 'user', content: query }],
				tools: [
					{
						type: 'web_search_20250305',
						name: 'web_search',
						max_uses: DEFAULT_MAX_SEARCHES,
					},
				],
			};
			if (options.temperature !== undefined) body.temperature = options.temperature;

			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'x-api-key': ctx.apiKey,
					'anthropic-version': '2023-06-01',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('claude-web-search', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as AnthropicResponse;

			const textParts: string[] = [];
			const citationsMap = new Map<string, Citation>();

			for (const block of data.content ?? []) {
				if (block.type === 'text') {
					textParts.push(block.text);
					for (const cit of block.citations ?? []) {
						if (cit.url && !citationsMap.has(cit.url)) {
							citationsMap.set(cit.url, {
								url: cit.url,
								title: cit.title ?? cit.url,
								snippet: cit.cited_text,
							});
						}
					}
				}
				if (block.type === 'web_search_tool_result') {
					const results = block.content as WebSearchResult[];
					for (const r of results) {
						if (r.url && !citationsMap.has(r.url)) {
							citationsMap.set(r.url, { url: r.url, title: r.title });
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
