/**
 * Multilingual Content Loader Service
 * Lädt und verwaltet Zitate in mehreren Sprachen
 */

import {
	quotesDE,
	quotesEN,
	authorsDE,
	authorsEN,
	type Author,
	type EnhancedQuote,
} from '@quote/shared';
import biographiesData from '../content/generated/biographies.json';

type Language = 'de' | 'en';

class MultilingualContentLoader {
	private quotes: Map<Language, EnhancedQuote[]> = new Map();
	private authors: Map<Language, Map<string, Author>> = new Map();
	private categories: Map<Language, Set<string>> = new Map();
	private tags: Map<Language, Set<string>> = new Map();
	private currentLanguage: Language = 'de';
	private initialized: boolean = false;

	constructor() {
		this.initialize();
	}

	private initialize() {
		// Initialize German data
		this.loadLanguageData('de', quotesDE, authorsDE);

		// Initialize English data
		this.loadLanguageData('en', quotesEN, authorsEN);

		this.initialized = true;
	}

	private loadLanguageData(
		lang: Language,
		quotesData: Omit<EnhancedQuote, 'author'>[],
		authorsData: Author[]
	) {
		// Load authors and enrich with markdown biographies
		const authorsMap = new Map<string, Author>();
		authorsData.forEach((author) => {
			// Check if we have a markdown biography for this author
			const markdownBio = (biographiesData as any)[author.id];

			if (markdownBio) {
				// Merge markdown biography with existing data
				author = {
					...author,
					biography: {
						...author.biography,
						...markdownBio,
						// Keep the short biography from TypeScript if markdown doesn't have one
						short: markdownBio.short || author.biography?.short || '',
					},
				};
			}

			authorsMap.set(author.id, author);
		});
		this.authors.set(lang, authorsMap);

		// Initialize collections for this language
		const categoriesSet = new Set<string>();
		const tagsSet = new Set<string>();

		// Load quotes and link with authors
		const enhancedQuotes: EnhancedQuote[] = quotesData.map((quote) => {
			const author = authorsMap.get(quote.authorId);

			// Collect categories and tags (language specific)
			quote.categories?.forEach((cat) => categoriesSet.add(cat));
			quote.tags?.forEach((tag) => tagsSet.add(tag));

			return {
				...quote,
				author,
				isFavorite: false,
			} as EnhancedQuote;
		});

		this.quotes.set(lang, enhancedQuotes);
		this.categories.set(lang, categoriesSet);
		this.tags.set(lang, tagsSet);
	}

	setLanguage(language: Language) {
		this.currentLanguage = language;
	}

	getCurrentLanguage(): Language {
		return this.currentLanguage;
	}

	getAllQuotes(): EnhancedQuote[] {
		return this.quotes.get(this.currentLanguage) || [];
	}

	getQuoteById(id: string): EnhancedQuote | undefined {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		return quotes.find((q) => q.id === id);
	}

	getAuthorById(id: string): Author | undefined {
		const authorsMap = this.authors.get(this.currentLanguage);
		return authorsMap?.get(id);
	}

	getAllAuthors(): Author[] {
		const authorsMap = this.authors.get(this.currentLanguage) || new Map();
		const quotes = this.quotes.get(this.currentLanguage) || [];

		// Add quote count to authors
		return Array.from(authorsMap.values()).map((author) => {
			const authorQuotes = quotes.filter((q) => q.authorId === author.id);
			return {
				...author,
				quoteIds: authorQuotes.map((q) => q.id),
				quoteCount: authorQuotes.length,
			};
		});
	}

	getFeaturedQuotes(): EnhancedQuote[] {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		return quotes.filter((q) => q.featured);
	}

	getQuotesByCategory(category: string): EnhancedQuote[] {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		return quotes.filter((q) => q.categories?.includes(category));
	}

	getQuotesByAuthor(authorId: string): EnhancedQuote[] {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		return quotes.filter((q) => q.authorId === authorId);
	}

	getAllCategories(): string[] {
		const categoriesSet = this.categories.get(this.currentLanguage) || new Set();
		return Array.from(categoriesSet).sort();
	}

	getAllTags(): string[] {
		const tagsSet = this.tags.get(this.currentLanguage) || new Set();
		return Array.from(tagsSet).sort();
	}

	getDailyQuote(date?: Date): EnhancedQuote | undefined {
		const targetDate = date || new Date();
		const dayOfYear = this.getDayOfYear(targetDate);
		const featured = this.getFeaturedQuotes();

		if (featured.length > 0) {
			const index = dayOfYear % featured.length;
			return featured[index];
		}

		const quotes = this.quotes.get(this.currentLanguage) || [];
		return quotes[0];
	}

	private getDayOfYear(date: Date): number {
		const start = new Date(date.getFullYear(), 0, 0);
		const diff = date.getTime() - start.getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	}

	searchQuotes(query: string): EnhancedQuote[] {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		const lowerQuery = query.toLowerCase();

		return quotes.filter(
			(quote) =>
				quote.text.toLowerCase().includes(lowerQuery) ||
				quote.author?.name.toLowerCase().includes(lowerQuery) ||
				quote.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
				quote.categories?.some((cat) => cat.toLowerCase().includes(lowerQuery))
		);
	}

	getRandomQuote(category?: string): EnhancedQuote | undefined {
		const pool = category ? this.getQuotesByCategory(category) : this.getAllQuotes();

		if (pool.length === 0) return undefined;

		const index = Math.floor(Math.random() * pool.length);
		return pool[index];
	}

	getStats() {
		const quotes = this.quotes.get(this.currentLanguage) || [];
		const authorsMap = this.authors.get(this.currentLanguage) || new Map();
		const categoriesSet = this.categories.get(this.currentLanguage) || new Set();
		const tagsSet = this.tags.get(this.currentLanguage) || new Set();

		return {
			totalQuotes: quotes.length,
			totalAuthors: authorsMap.size,
			totalCategories: categoriesSet.size,
			totalTags: tagsSet.size,
			featuredQuotes: quotes.filter((q) => q.featured).length,
			currentLanguage: this.currentLanguage,
		};
	}
}

// Singleton Export
export const multilingualContentLoader = new MultilingualContentLoader();
