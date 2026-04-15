import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { DEFAULT_USER_AGENT, type ExtractedArticle } from './types';

// JSDOM's default virtualConsole rethrows CSS parse errors as
// uncaughtException, which kills long-running services. A bare
// VirtualConsole with no listeners swallows everything.
const silentConsole = new VirtualConsole();

export async function extractFromHtml(html: string, url: string): Promise<ExtractedArticle | null> {
	try {
		const dom = new JSDOM(html, { url, virtualConsole: silentConsole });
		const article = new Readability(dom.window.document).parse();
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

export async function extractFromUrl(url: string): Promise<ExtractedArticle | null> {
	let html: string;
	try {
		const response = await fetch(url, {
			headers: { 'User-Agent': DEFAULT_USER_AGENT },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return null;
		html = await response.text();
	} catch {
		return null;
	}
	return extractFromHtml(html, url);
}
