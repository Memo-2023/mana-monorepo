/**
 * Mozilla Readability fallback. Used when an RSS item only ships an
 * excerpt, so we fetch the original page and extract the article body.
 *
 * Kept dependency-local to the ingester so this service is the canonical
 * "content acquisition" boundary — apps/api never has to call out to a
 * crawler.
 */

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedArticle {
	title: string | null;
	content: string;
	htmlContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

const USER_AGENT = 'Mozilla/5.0 (compatible; ManaNewsIngester/1.0; +https://mana.how/news)';

export async function fetchAndExtract(url: string): Promise<ExtractedArticle | null> {
	let html: string;
	try {
		const response = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return null;
		html = await response.text();
	} catch {
		return null;
	}

	try {
		const dom = new JSDOM(html, { url });
		const reader = new Readability(dom.window.document);
		const article = reader.parse();
		if (!article || !article.textContent) return null;

		const wordCount = article.textContent.split(/\s+/).filter(Boolean).length;
		const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

		return {
			title: article.title ?? null,
			content: article.textContent,
			htmlContent: article.content ?? '',
			excerpt: article.excerpt || article.textContent.slice(0, 240),
			byline: article.byline ?? null,
			siteName: article.siteName ?? null,
			wordCount,
			readingTimeMinutes,
		};
	} catch {
		return null;
	}
}
