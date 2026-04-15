/**
 * News Tools — LLM-accessible operations for the news module.
 *
 * `save_news_article` is the agent's path into the user's reading list.
 * On approve, the executor calls `articlesStore.saveFromUrl(url)` which
 * routes through `apps/api /api/v1/news/extract/save` (Readability) and
 * stores the encrypted result in `newsArticles`. `title` and `summary`
 * are display hints — the canonical title/excerpt come back from the
 * extractor so the AI can't lie about content.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { articlesStore } from './stores/articles.svelte';

export const newsTools: ModuleTool[] = [
	{
		name: 'save_news_article',
		module: 'news',
		description:
			'Speichert einen Artikel von einer URL in die Leseliste. URL wird serverseitig per Readability extrahiert.',
		parameters: [
			{ name: 'url', type: 'string', description: 'Die Artikel-URL', required: true },
			{
				name: 'title',
				type: 'string',
				description: 'Anzeigetitel für den Approval-Dialog (informativ)',
				required: false,
			},
			{
				name: 'summary',
				type: 'string',
				description: 'Kurze Begründung warum dieser Artikel relevant ist',
				required: false,
			},
		],
		async execute(params) {
			const url = params.url as string;
			const article = await articlesStore.saveFromUrl(url);
			return {
				success: true,
				message: `Artikel gespeichert: ${article.title}`,
				data: { articleId: article.id, title: article.title },
			};
		},
	},
];
