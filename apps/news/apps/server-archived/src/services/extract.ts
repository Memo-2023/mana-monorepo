import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedArticle {
	title: string;
	content: string;
	htmlContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

export class ExtractService {
	async extractFromUrl(url: string): Promise<ExtractedArticle> {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ManaNews/1.0; +https://mana.how)',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch URL: ${response.status}`);
		}

		const html = await response.text();
		const dom = new JSDOM(html, { url });
		const reader = new Readability(dom.window.document);
		const article = reader.parse();

		if (!article) {
			throw new Error('Could not extract article content');
		}

		const wordCount = article.textContent.split(/\s+/).filter(Boolean).length;
		const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

		return {
			title: article.title,
			content: article.textContent,
			htmlContent: article.content,
			excerpt: article.excerpt || article.textContent.slice(0, 200),
			byline: article.byline || null,
			siteName: article.siteName || null,
			wordCount,
			readingTimeMinutes,
		};
	}
}
