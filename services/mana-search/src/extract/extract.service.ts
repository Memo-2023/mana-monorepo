import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extract } from '@extractus/article-extractor';
import TurndownService from 'turndown';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import {
	ExtractRequestDto,
	ExtractOptionsDto,
	BulkExtractRequestDto,
} from './dto/extract-request.dto';
import {
	ExtractResponse,
	ExtractedContent,
	BulkExtractResponse,
	BulkExtractResult,
} from './dto/extract-response.dto';

@Injectable()
export class ExtractService {
	private readonly logger = new Logger(ExtractService.name);
	private readonly turndown: TurndownService;
	private readonly defaultTimeout: number;
	private readonly defaultMaxLength: number;
	private readonly userAgent: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
		private readonly metricsService: MetricsService,
	) {
		this.defaultTimeout = this.configService.get<number>('extract.timeout', 10000);
		this.defaultMaxLength = this.configService.get<number>('extract.maxLength', 50000);
		this.userAgent = this.configService.get<string>(
			'extract.userAgent',
			'Mozilla/5.0 (compatible; ManaSearchBot/1.0)',
		);

		// Configure Turndown for Markdown conversion
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
	}

	async extract(request: ExtractRequestDto): Promise<ExtractResponse> {
		const startTime = Date.now();
		const cacheKey = `extract:${request.url}`;

		// Check cache
		const cached = await this.cacheService.get<ExtractResponse>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for: ${request.url}`);
			return {
				...cached,
				meta: { ...cached.meta, cached: true },
			};
		}

		try {
			const article = await extract(request.url, {
				signal: AbortSignal.timeout(request.options?.timeout || this.defaultTimeout),
			});

			if (!article) {
				return this.buildErrorResponse(
					request.url,
					'Could not extract content from URL',
					startTime,
				);
			}

			// Process content
			let text = this.cleanText(article.content || '');
			const maxLength = request.options?.maxLength || this.defaultMaxLength;

			if (text.length > maxLength) {
				text = text.substring(0, maxLength) + '...';
			}

			const content: ExtractedContent = {
				title: article.title || '',
				description: article.description,
				author: article.author,
				publishedDate: article.published,
				siteName: article.source,

				text,
				wordCount: this.countWords(text),
				readingTime: Math.ceil(this.countWords(text) / 200),

				ogImage: article.image,
				language: article.language,
			};

			// Optional: Markdown conversion
			if (request.options?.includeMarkdown && article.content) {
				content.markdown = this.turndown.turndown(article.content);
			}

			// Optional: Include raw HTML
			if (request.options?.includeHtml && article.content) {
				content.html = article.content;
			}

			const response: ExtractResponse = {
				success: true,
				content,
				meta: {
					url: request.url,
					duration: Date.now() - startTime,
					cached: false,
					contentType: 'text/html',
				},
			};

			// Cache the result
			const ttl = this.configService.get<number>('cache.extractTtl', 86400);
			await this.cacheService.set(cacheKey, response, ttl);

			this.metricsService.recordRequest('extract', 200, Date.now() - startTime);
			return response;
		} catch (error) {
			this.logger.error(`Extraction failed for ${request.url}: ${error}`);
			this.metricsService.recordRequest('extract', 500, Date.now() - startTime);

			return this.buildErrorResponse(
				request.url,
				error instanceof Error ? error.message : 'Extraction failed',
				startTime,
			);
		}
	}

	async bulkExtract(request: BulkExtractRequestDto): Promise<BulkExtractResponse> {
		const startTime = Date.now();
		const concurrency = request.concurrency || 5;

		// Process URLs in batches
		const results: BulkExtractResult[] = [];

		for (let i = 0; i < request.urls.length; i += concurrency) {
			const batch = request.urls.slice(i, i + concurrency);
			const batchResults = await Promise.all(
				batch.map(async (url) => {
					const response = await this.extract({
						url,
						options: request.options,
					});

					return {
						url,
						success: response.success,
						content: response.content,
						error: response.error,
					};
				}),
			);

			results.push(...batchResults);
		}

		const successful = results.filter((r) => r.success).length;

		return {
			results,
			meta: {
				total: results.length,
				successful,
				failed: results.length - successful,
				duration: Date.now() - startTime,
			},
		};
	}

	private buildErrorResponse(
		url: string,
		error: string,
		startTime: number,
	): ExtractResponse {
		return {
			success: false,
			error,
			meta: {
				url,
				duration: Date.now() - startTime,
				cached: false,
				contentType: 'unknown',
			},
		};
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

	private countWords(text: string): number {
		return text
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
	}
}
