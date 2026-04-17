/**
 * News Research tools — expose the discovery + search pipeline to the
 * AI companion. Non-destructive: these fetch from public RSS feeds and
 * return structured context. They don't mutate anything on the user's
 * side, so `propose` is overkill — they run auto.
 *
 * Companion flow: `research_news({query})` → the LLM gets a curated
 * context block it can cite from. No IndexedDB writes happen inside
 * this tool; if the AI wants to keep an article, it follows up with
 * `save_news_article` from the news module.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { discoverByQuery, searchFeeds } from './api';
import { compareResearch } from '$lib/modules/research-lab/api';
import type { AgentAnswer } from '$lib/modules/research-lab/types';

const MAX_RESULTS = 15;

const DEEP_AGENT_PREFERENCE = [
	'perplexity-sonar',
	'gemini-grounding',
	'openai-responses',
	'claude-web-search',
] as const;

function formatContext(
	query: string,
	feedCount: number,
	articles: Array<{
		url: string;
		title: string;
		excerpt: string | null;
		publishedAt: string | null;
		feedUrl: string;
	}>
): string {
	const lines = [
		`# News Research — Query: ${query}`,
		`Feeds consulted: ${feedCount}`,
		`Hits: ${articles.length}`,
		'',
	];
	for (const a of articles) {
		lines.push(
			`## ${a.title}`,
			`Published: ${a.publishedAt ?? 'unknown'}`,
			`Source feed: ${a.feedUrl}`,
			`URL: ${a.url}`,
			a.excerpt ? `\n${a.excerpt}` : '',
			''
		);
	}
	return lines.join('\n');
}

function formatDeepContext(query: string, providers: string[], answers: AgentAnswer[]): string {
	const lines = [
		`# Deep Research — Query: ${query}`,
		`Agents consulted: ${providers.join(', ')}`,
		'',
	];
	for (let i = 0; i < answers.length; i++) {
		const provider = providers[i];
		const answer = answers[i];
		if (!answer) continue;
		lines.push(`## ${provider}`, '', answer.answer, '');
		if (answer.citations.length > 0) {
			lines.push('### Sources');
			for (const cit of answer.citations) {
				lines.push(`- [${cit.title || cit.url}](${cit.url})`);
			}
			lines.push('');
		}
	}
	return lines.join('\n');
}

export const newsResearchTools: ModuleTool[] = [
	{
		name: 'research_news',
		module: 'news-research',
		description:
			'Entdeckt zum Thema passende RSS-Feeds, durchsucht deren Artikel nach Stichworten und liefert ein strukturiertes Kontext-Paket für die KI. Nur lesend.',
		parameters: [
			{
				name: 'query',
				type: 'string',
				description: 'Thema oder Stichworte (z.B. "KI-Regulierung EU")',
				required: true,
			},
			{
				name: 'depth',
				type: 'string',
				description:
					'"shallow" (Standard, kostenlos — RSS-Feeds durchsuchen) oder "deep" (kostet Credits — fragt 1–2 Research-Agents wie Perplexity/Gemini mit web_search).',
				required: false,
			},
			{
				name: 'language',
				type: 'string',
				description: 'Sprache der Feeds (de/en); optional, nur für shallow',
				required: false,
			},
			{
				name: 'limit',
				type: 'number',
				description: `Maximale Anzahl Treffer im shallow-Modus (Standard ${MAX_RESULTS})`,
				required: false,
			},
		],
		async execute(params) {
			const query = String(params.query ?? '').trim();
			if (!query) {
				return { success: false, message: 'query is required' };
			}
			const depth = String(params.depth ?? 'shallow').toLowerCase();
			const language = typeof params.language === 'string' ? params.language : undefined;
			const limit = Math.min(Math.max(Number(params.limit) || MAX_RESULTS, 1), 50);

			if (depth === 'deep') {
				// Ask 2 research agents in parallel; prefer cheapest-first order.
				const providers = [...DEEP_AGENT_PREFERENCE].slice(0, 2);
				try {
					const res = await compareResearch(query, providers);
					const answers = res.results.map((r) => r.data?.answer).filter(Boolean) as AgentAnswer[];
					const successful = res.results.filter((r) => r.success);
					const context = formatDeepContext(
						query,
						successful.map((r) => r.provider),
						answers
					);
					return {
						success: true,
						message: `Deep Research: ${successful.length} / ${res.results.length} Agents geantwortet.`,
						data: {
							context,
							runId: res.runId,
							answers: answers.map((a, i) => ({
								provider: successful[i]?.provider,
								answer: a.answer,
								citations: a.citations,
							})),
						},
					};
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Deep research fehlgeschlagen';
					return { success: false, message };
				}
			}

			// shallow (default): RSS discovery + keyword search
			const discovered = await discoverByQuery(query, language);
			const feedUrls = discovered.feeds.slice(0, 10).map((f) => f.url);
			if (feedUrls.length === 0) {
				return {
					success: true,
					message: 'Keine passenden Feeds gefunden.',
					data: { context: '', feedCount: 0, articles: [] },
				};
			}

			const { articles } = await searchFeeds(feedUrls, query, { limit });
			const context = formatContext(query, feedUrls.length, articles);

			return {
				success: true,
				message: `${articles.length} Artikel aus ${feedUrls.length} Feeds.`,
				data: { context, feedCount: feedUrls.length, articles },
			};
		},
	},
];
