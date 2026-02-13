import { Injectable, Logger } from '@nestjs/common';
import {
	type Quote,
	type Category,
	QUOTES,
	CATEGORIES,
	CATEGORY_LABELS,
	getRandomQuote,
	getDailyQuote,
	getQuotesByCategory,
	getRandomQuoteByCategory,
	searchQuotes,
	getQuoteById,
	getQuoteByIndex,
	getAllCategories,
	getCategoryByName,
	formatQuote,
	formatQuoteWithNumber,
	getTotalCount,
} from '@zitare/content';

@Injectable()
export class QuotesService {
	private readonly logger = new Logger(QuotesService.name);
	private dailyQuoteCache: { date: string; quote: Quote } | null = null;

	getRandomQuote(): Quote {
		return getRandomQuote();
	}

	getDailyQuote(): Quote {
		const today = new Date().toISOString().split('T')[0];

		// Return cached daily quote if same day
		if (this.dailyQuoteCache && this.dailyQuoteCache.date === today) {
			return this.dailyQuoteCache.quote;
		}

		const quote = getDailyQuote();
		this.dailyQuoteCache = { date: today, quote };
		this.logger.log(`Daily quote for ${today}: "${quote.text.substring(0, 30)}..."`);

		return quote;
	}

	getQuotesByCategory(category: Category): Quote[] {
		return getQuotesByCategory(category);
	}

	getRandomQuoteByCategory(category: Category): Quote | null {
		return getRandomQuoteByCategory(category);
	}

	searchQuotes(searchText: string): Quote[] {
		return searchQuotes(searchText);
	}

	getQuoteById(id: string): Quote | undefined {
		return getQuoteById(id);
	}

	getQuoteByIndex(index: number): Quote | null {
		return getQuoteByIndex(index);
	}

	getAllCategories(): { category: Category; label: string; count: number }[] {
		return getAllCategories();
	}

	getCategoryByName(name: string): Category | null {
		return getCategoryByName(name);
	}

	getTotalCount(): number {
		return getTotalCount();
	}

	formatQuote(quote: Quote): string {
		return formatQuote(quote);
	}

	formatQuoteWithNumber(quote: Quote, number: number): string {
		return formatQuoteWithNumber(quote, number);
	}
}
