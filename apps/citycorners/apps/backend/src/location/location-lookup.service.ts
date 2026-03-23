import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LookupResult {
	name: string;
	description: string;
	address?: string;
	category?: string;
	sources: { url: string; title: string }[];
}

@Injectable()
export class LocationLookupService {
	private readonly logger = new Logger(LocationLookupService.name);
	private readonly searchUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.searchUrl = this.configService.get<string>('MANA_SEARCH_URL') || 'http://localhost:3021';
	}

	async lookup(query: string): Promise<LookupResult | null> {
		const searchQuery = `${query} Konstanz`;

		try {
			// Search for the location
			const searchRes = await fetch(`${this.searchUrl}/api/v1/search`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: searchQuery,
					options: { categories: ['general'], language: 'de-DE', limit: 5 },
				}),
				signal: AbortSignal.timeout(15000),
			});

			if (!searchRes.ok) {
				this.logger.warn(`Search failed: ${searchRes.status}`);
				return null;
			}

			const searchData = await searchRes.json();
			const results = searchData.results || [];

			if (results.length === 0) return null;

			// Extract content from top 3 results
			const topUrls = results.slice(0, 3).map((r: any) => r.url);
			let extractedTexts: string[] = [];

			try {
				const extractRes = await fetch(`${this.searchUrl}/api/v1/extract/bulk`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						urls: topUrls,
						options: { includeMarkdown: false, maxLength: 5000 },
						concurrency: 3,
					}),
					signal: AbortSignal.timeout(20000),
				});

				if (extractRes.ok) {
					const extractData = await extractRes.json();
					extractedTexts = (extractData.results || [])
						.filter((r: any) => r.success && r.content?.text)
						.map((r: any) => r.content.text.substring(0, 2000));
				}
			} catch (err) {
				this.logger.warn('Bulk extract failed, using search snippets', err);
			}

			// Combine search snippets + extracted text for the description
			const snippets = results.map((r: any) => r.snippet).filter(Boolean);
			const allText = [...extractedTexts, ...snippets].join('\n\n');

			// Try to detect address from text
			const address = this.extractAddress(allText);

			// Try to guess category
			const category = this.guessCategory(query, allText);

			// Build a description from the best snippet or extracted text
			const description = this.buildDescription(snippets, extractedTexts);

			return {
				name: query,
				description,
				address,
				category,
				sources: results.slice(0, 5).map((r: any) => ({
					url: r.url,
					title: r.title,
				})),
			};
		} catch (err) {
			this.logger.error('Lookup failed', err);
			return null;
		}
	}

	private extractAddress(text: string): string | undefined {
		// Look for German address patterns (street + number + PLZ + city)
		const addressPattern =
			/(\b[A-ZÄÖÜ][a-zäöüß]+(?:straße|gasse|weg|platz|allee|ring)\s+\d+[\w]*,?\s*\d{5}\s+\w+)/i;
		const match = text.match(addressPattern);
		if (match) return match[1];

		// Simpler: just street + number in Konstanz
		const simplePattern =
			/(\b[A-ZÄÖÜ][a-zäöüß]+(?:straße|gasse|weg|platz|allee|ring)\s+\d+[\w-]*)/i;
		const simpleMatch = text.match(simplePattern);
		if (simpleMatch) return `${simpleMatch[1]}, 78462 Konstanz`;

		return undefined;
	}

	private guessCategory(query: string, text: string): string {
		const lowerQuery = query.toLowerCase();
		const lowerText = text.toLowerCase();

		if (
			/restaurant|essen|küche|dining|speise|bistro|gasth/i.test(
				lowerQuery + ' ' + lowerText.substring(0, 500)
			)
		) {
			return 'restaurant';
		}
		if (
			/museum|ausstellung|galerie|sammlung/i.test(lowerQuery + ' ' + lowerText.substring(0, 500))
		) {
			return 'museum';
		}
		if (
			/laden|shop|geschäft|boutique|markt|einkauf|shopping/i.test(
				lowerQuery + ' ' + lowerText.substring(0, 500)
			)
		) {
			return 'shop';
		}
		return 'sight';
	}

	private buildDescription(snippets: string[], extractedTexts: string[]): string {
		// Prefer extracted text (more detailed)
		if (extractedTexts.length > 0) {
			const text = extractedTexts[0];
			// Take first meaningful paragraph (at least 50 chars)
			const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50);
			if (paragraphs.length > 0) {
				const desc = paragraphs[0].trim();
				return desc.length > 300 ? desc.substring(0, 297) + '...' : desc;
			}
		}

		// Fall back to search snippets
		if (snippets.length > 0) {
			const combined = snippets.slice(0, 2).join(' ');
			return combined.length > 300 ? combined.substring(0, 297) + '...' : combined;
		}

		return '';
	}
}
