import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { CrawlSelectors } from '../db/schema';

export interface ParsedPage {
	title: string;
	content: string;
	markdown?: string;
	html?: string;
	links: string[];
	metadata: Record<string, unknown>;
}

export interface ParseOptions {
	selectors?: CrawlSelectors;
	includeMarkdown?: boolean;
	includeHtml?: boolean;
	baseUrl: string;
}

@Injectable()
export class ParserService {
	private readonly logger = new Logger(ParserService.name);
	private readonly turndown: TurndownService;

	constructor(private readonly configService: ConfigService) {
		this.turndown = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
			bulletListMarker: '-',
		});

		// Custom rules for better Markdown output
		this.turndown.addRule('codeBlocks', {
			filter: ['pre'],
			replacement: (content: string) => `\n\`\`\`\n${content}\n\`\`\`\n`,
		});

		this.turndown.addRule('inlineCode', {
			filter: ['code'],
			replacement: (content: string) => `\`${content}\``,
		});

		// Remove script and style elements
		this.turndown.remove(['script', 'style', 'noscript']);
	}

	parse(html: string, options: ParseOptions): ParsedPage {
		const $ = cheerio.load(html);
		const { selectors, includeMarkdown, includeHtml, baseUrl } = options;

		// Remove unwanted elements
		$('script, style, noscript, iframe, svg').remove();

		// Extract title
		const title = this.extractTitle($, selectors?.title);

		// Extract main content
		const contentHtml = this.extractContent($, selectors?.content);
		const content = this.cleanText(contentHtml);

		// Extract links
		const links = this.extractLinks($, baseUrl, selectors?.links);

		// Extract metadata
		const metadata = this.extractMetadata($);

		// Extract custom selectors
		if (selectors?.custom) {
			for (const [key, selector] of Object.entries(selectors.custom)) {
				try {
					metadata[key] = $(selector).text().trim() || $(selector).attr('content');
				} catch {
					this.logger.warn(`Failed to extract custom selector: ${key}`);
				}
			}
		}

		const result: ParsedPage = {
			title,
			content,
			links,
			metadata,
		};

		if (includeMarkdown && contentHtml) {
			result.markdown = this.turndown.turndown(contentHtml);
		}

		if (includeHtml) {
			result.html = contentHtml;
		}

		return result;
	}

	private extractTitle($: cheerio.CheerioAPI, selector?: string): string {
		if (selector) {
			const customTitle = $(selector).text().trim();
			if (customTitle) return customTitle;
		}

		// Try common title patterns
		const h1 = $('h1').first().text().trim();
		if (h1) return h1;

		const title = $('title').text().trim();
		if (title) return title;

		const ogTitle = $('meta[property="og:title"]').attr('content');
		if (ogTitle) return ogTitle;

		return '';
	}

	private extractContent($: cheerio.CheerioAPI, selector?: string): string {
		if (selector) {
			const customContent = $(selector).html();
			if (customContent) return customContent;
		}

		// Try common content patterns
		const contentSelectors = [
			'article',
			'main',
			'[role="main"]',
			'.main-content',
			'.content',
			'.post-content',
			'.article-content',
			'.entry-content',
			'#content',
			'#main',
		];

		for (const sel of contentSelectors) {
			const content = $(sel).html();
			if (content && content.length > 100) {
				return content;
			}
		}

		// Fallback to body
		return $('body').html() || '';
	}

	private extractLinks(
		$: cheerio.CheerioAPI,
		baseUrl: string,
		selector?: string,
	): string[] {
		const links = new Set<string>();
		const baseUrlObj = new URL(baseUrl);

		const linkSelector = selector || 'a[href]';

		$(linkSelector).each((_, element) => {
			const href = $(element).attr('href');
			if (!href) return;

			try {
				// Skip non-http links
				if (
					href.startsWith('javascript:') ||
					href.startsWith('mailto:') ||
					href.startsWith('tel:') ||
					href.startsWith('#')
				) {
					return;
				}

				// Resolve relative URLs
				const absoluteUrl = new URL(href, baseUrl);

				// Only include same-origin links (or all if needed)
				if (absoluteUrl.origin === baseUrlObj.origin) {
					// Remove hash and normalize
					absoluteUrl.hash = '';
					links.add(absoluteUrl.href);
				}
			} catch {
				// Invalid URL, skip
			}
		});

		return Array.from(links);
	}

	private extractMetadata($: cheerio.CheerioAPI): Record<string, unknown> {
		const metadata: Record<string, unknown> = {};

		// OpenGraph metadata
		$('meta[property^="og:"]').each((_, element) => {
			const property = $(element).attr('property')?.replace('og:', '');
			const content = $(element).attr('content');
			if (property && content) {
				metadata[`og_${property}`] = content;
			}
		});

		// Standard meta tags
		const description = $('meta[name="description"]').attr('content');
		if (description) metadata.description = description;

		const keywords = $('meta[name="keywords"]').attr('content');
		if (keywords) metadata.keywords = keywords;

		const author = $('meta[name="author"]').attr('content');
		if (author) metadata.author = author;

		const canonical = $('link[rel="canonical"]').attr('href');
		if (canonical) metadata.canonical = canonical;

		// Schema.org JSON-LD
		$('script[type="application/ld+json"]').each((_, element) => {
			try {
				const json = JSON.parse($(element).html() || '');
				if (!metadata.jsonLd) {
					metadata.jsonLd = [];
				}
				(metadata.jsonLd as unknown[]).push(json);
			} catch {
				// Invalid JSON, skip
			}
		});

		return metadata;
	}

	private cleanText(html: string): string {
		return html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
