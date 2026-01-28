import { Injectable, Logger } from '@nestjs/common';
import { QUOTES, Quote, Category, CATEGORIES, CATEGORY_LABELS } from '../config/configuration';

@Injectable()
export class QuotesService {
	private readonly logger = new Logger(QuotesService.name);
	private dailyQuoteCache: { date: string; quote: Quote } | null = null;

	getRandomQuote(): Quote {
		const index = Math.floor(Math.random() * QUOTES.length);
		return QUOTES[index];
	}

	getDailyQuote(): Quote {
		const today = new Date().toISOString().split('T')[0];

		// Return cached daily quote if same day
		if (this.dailyQuoteCache && this.dailyQuoteCache.date === today) {
			return this.dailyQuoteCache.quote;
		}

		// Generate deterministic quote based on date
		const dateHash = this.hashDate(today);
		const index = dateHash % QUOTES.length;
		const quote = QUOTES[index];

		this.dailyQuoteCache = { date: today, quote };
		this.logger.log(`Daily quote for ${today}: "${quote.text.substring(0, 30)}..."`);

		return quote;
	}

	private hashDate(dateStr: string): number {
		let hash = 0;
		for (let i = 0; i < dateStr.length; i++) {
			const char = dateStr.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	getQuotesByCategory(category: Category): Quote[] {
		return QUOTES.filter((q) => q.category === category);
	}

	getRandomQuoteByCategory(category: Category): Quote | null {
		const quotes = this.getQuotesByCategory(category);
		if (quotes.length === 0) return null;
		const index = Math.floor(Math.random() * quotes.length);
		return quotes[index];
	}

	searchQuotes(searchText: string): Quote[] {
		const lowerSearch = searchText.toLowerCase();
		return QUOTES.filter(
			(q) =>
				q.text.toLowerCase().includes(lowerSearch) || q.author.toLowerCase().includes(lowerSearch)
		);
	}

	getQuoteById(id: string): Quote | undefined {
		return QUOTES.find((q) => q.id === id);
	}

	getQuoteByIndex(index: number): Quote | null {
		if (index < 1 || index > QUOTES.length) return null;
		return QUOTES[index - 1];
	}

	getAllCategories(): { category: Category; label: string; count: number }[] {
		return CATEGORIES.map((category) => ({
			category,
			label: CATEGORY_LABELS[category],
			count: QUOTES.filter((q) => q.category === category).length,
		}));
	}

	getCategoryByName(name: string): Category | null {
		const lowerName = name.toLowerCase();

		// Try exact match first
		if (CATEGORIES.includes(lowerName as Category)) {
			return lowerName as Category;
		}

		// Try partial match
		for (const category of CATEGORIES) {
			if (
				category.startsWith(lowerName) ||
				CATEGORY_LABELS[category].toLowerCase().startsWith(lowerName)
			) {
				return category;
			}
		}

		return null;
	}

	getTotalCount(): number {
		return QUOTES.length;
	}

	formatQuote(quote: Quote): string {
		const categoryLabel = CATEGORY_LABELS[quote.category];
		return `"${quote.text}"\n\n— *${quote.author}*\n\n[${categoryLabel}]`;
	}

	formatQuoteWithNumber(quote: Quote, number: number): string {
		const categoryLabel = CATEGORY_LABELS[quote.category];
		return `**#${number}**\n"${quote.text}"\n\n— *${quote.author}* [${categoryLabel}]`;
	}
}
