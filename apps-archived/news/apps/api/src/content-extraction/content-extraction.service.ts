import { Injectable, BadRequestException } from '@nestjs/common';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ArticlesService } from '../articles/articles.service';

export interface ExtractedContent {
	title: string;
	content: string;
	htmlContent: string;
	excerpt?: string;
	byline?: string;
	siteName?: string;
}

@Injectable()
export class ContentExtractionService {
	constructor(private articlesService: ArticlesService) {}

	async extractFromUrl(url: string): Promise<ExtractedContent> {
		// Validate URL
		try {
			new URL(url);
		} catch {
			throw new BadRequestException('Invalid URL');
		}

		// Fetch the page
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
			},
		});

		if (!response.ok) {
			throw new BadRequestException(
				`Failed to fetch URL: ${response.status} ${response.statusText}`
			);
		}

		const html = await response.text();

		// Parse with JSDOM
		const dom = new JSDOM(html, { url });
		const reader = new Readability(dom.window.document);
		const article = reader.parse();

		if (!article) {
			throw new BadRequestException('Could not extract article content from this page');
		}

		return {
			title: article.title || 'Untitled',
			content: article.textContent || '',
			htmlContent: article.content || '',
			excerpt: article.excerpt,
			byline: article.byline,
			siteName: article.siteName,
		};
	}

	async saveArticleFromUrl(userId: string, url: string) {
		const extracted = await this.extractFromUrl(url);

		return this.articlesService.createSavedArticle({
			userId,
			title: extracted.title,
			content: extracted.content,
			parsedContent: extracted.htmlContent,
			originalUrl: url,
			author: extracted.byline,
		});
	}
}
