/**
 * News Tools — LLM-accessible operations for the news module.
 *
 * `save_news_article` is the agent's path into the user's reading list.
 * M5 moved the saved-article storage to the `articles` module; this
 * tool now routes through `articlesStore.saveFromUrl(url)` there. The
 * tool name stays `save_news_article` because historic AI mission
 * iterations in the DB reference it — renaming would break the audit
 * trail. A future `save_article` can be added as an alias in M6.
 *
 * `title` and `summary` are display hints for the approval dialog —
 * the canonical title/excerpt come from the extractor so the AI can't
 * lie about content.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { articlesStore } from '$lib/modules/articles/stores/articles.svelte';

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
			const { article, duplicate } = await articlesStore.saveFromUrl(url);
			return {
				success: true,
				message: duplicate
					? `Artikel bereits gespeichert: ${article.title}`
					: `Artikel gespeichert: ${article.title}`,
				data: { articleId: article.id, title: article.title, duplicate },
			};
		},
	},
];
