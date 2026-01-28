import { Injectable, Logger } from '@nestjs/common';
import { Quote, Author, QuoteWithAuthor } from './types';
import quotesJson from './data/quotes.json';
import authorsJson from './data/authors.json';

@Injectable()
export class QuotesService {
	private readonly logger = new Logger(QuotesService.name);
	private readonly quotes: Quote[];
	private readonly authors: Map<string, Author>;

	constructor() {
		this.quotes = quotesJson as Quote[];
		this.authors = new Map((authorsJson as Author[]).map((a) => [a.id, a]));
		this.logger.log(`Loaded ${this.quotes.length} quotes and ${this.authors.size} authors`);
	}

	private getAuthor(authorId: string): Author {
		return this.authors.get(authorId) || { id: authorId, name: 'Unbekannt' };
	}

	private toQuoteWithAuthor(quote: Quote): QuoteWithAuthor {
		return {
			id: quote.id,
			text: quote.text,
			author: this.getAuthor(quote.authorId),
		};
	}

	getRandomQuote(): QuoteWithAuthor {
		const index = Math.floor(Math.random() * this.quotes.length);
		return this.toQuoteWithAuthor(this.quotes[index]);
	}

	getQuoteById(id: string): QuoteWithAuthor | null {
		const quote = this.quotes.find((q) => q.id === id);
		return quote ? this.toQuoteWithAuthor(quote) : null;
	}

	getQuotesByIds(ids: string[]): QuoteWithAuthor[] {
		return ids.map((id) => this.getQuoteById(id)).filter((q): q is QuoteWithAuthor => q !== null);
	}

	search(term: string, limit = 5): QuoteWithAuthor[] {
		const lowerTerm = term.toLowerCase();
		const results: QuoteWithAuthor[] = [];

		for (const quote of this.quotes) {
			if (results.length >= limit) break;

			const author = this.getAuthor(quote.authorId);
			if (
				quote.text.toLowerCase().includes(lowerTerm) ||
				author.name.toLowerCase().includes(lowerTerm)
			) {
				results.push(this.toQuoteWithAuthor(quote));
			}
		}

		return results;
	}

	getByAuthor(authorName: string, limit = 5): QuoteWithAuthor[] {
		const lowerName = authorName.toLowerCase();
		const results: QuoteWithAuthor[] = [];

		// Find matching author(s)
		const matchingAuthorIds: string[] = [];
		for (const author of this.authors.values()) {
			if (author.name.toLowerCase().includes(lowerName)) {
				matchingAuthorIds.push(author.id);
			}
		}

		if (matchingAuthorIds.length === 0) {
			return [];
		}

		// Get quotes from matching authors
		for (const quote of this.quotes) {
			if (results.length >= limit) break;

			if (matchingAuthorIds.includes(quote.authorId)) {
				results.push(this.toQuoteWithAuthor(quote));
			}
		}

		return results;
	}

	getAllAuthors(): Author[] {
		return Array.from(this.authors.values());
	}

	getTotalCount(): number {
		return this.quotes.length;
	}

	formatQuote(quote: QuoteWithAuthor): string {
		const profession =
			quote.author.profession && quote.author.profession.length > 0
				? ` (${quote.author.profession.join(', ')})`
				: '';
		return `„${quote.text}"\n\n— ${quote.author.name}${profession}`;
	}
}
