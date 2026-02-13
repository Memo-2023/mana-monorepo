import { QUOTES } from './quotes';
import { CATEGORIES, CATEGORY_LABELS, type Category } from './categories';
import type { Quote, SupportedLanguage } from './types';

/**
 * Get a random quote
 */
export function getRandomQuote(): Quote {
	const index = Math.floor(Math.random() * QUOTES.length);
	return QUOTES[index];
}

/**
 * Get deterministic daily quote based on date
 */
export function getDailyQuote(date: Date = new Date()): Quote {
	const dateStr = date.toISOString().split('T')[0];
	const hash = hashString(dateStr);
	const index = Math.abs(hash) % QUOTES.length;
	return QUOTES[index];
}

/**
 * Get quotes by category
 */
export function getQuotesByCategory(category: Category): Quote[] {
	return QUOTES.filter((q) => q.category === category);
}

/**
 * Get a random quote from a specific category
 */
export function getRandomQuoteByCategory(category: Category): Quote | null {
	const quotes = getQuotesByCategory(category);
	if (quotes.length === 0) return null;
	const index = Math.floor(Math.random() * quotes.length);
	return quotes[index];
}

/**
 * Search quotes by text or author (searches in specified language, defaults to German)
 */
export function searchQuotes(searchText: string, language: SupportedLanguage = 'de'): Quote[] {
	const lowerSearch = searchText.toLowerCase();
	return QUOTES.filter((q) => {
		const text = language === 'original' ? q.text.original : q.text[language];
		return text.toLowerCase().includes(lowerSearch) || q.author.toLowerCase().includes(lowerSearch);
	});
}

/**
 * Get a quote by ID
 */
export function getQuoteById(id: string): Quote | undefined {
	return QUOTES.find((q) => q.id === id);
}

/**
 * Get quote by index (1-based)
 */
export function getQuoteByIndex(index: number): Quote | null {
	if (index < 1 || index > QUOTES.length) return null;
	return QUOTES[index - 1];
}

/**
 * Get all categories with counts
 */
export function getAllCategories(): { category: Category; label: string; count: number }[] {
	return CATEGORIES.map((category) => ({
		category,
		label: CATEGORY_LABELS[category],
		count: QUOTES.filter((q) => q.category === category).length,
	}));
}

/**
 * Find category by name (partial match)
 */
export function getCategoryByName(name: string): Category | null {
	const lowerName = name.toLowerCase();

	// Exact match first
	if (CATEGORIES.includes(lowerName as Category)) {
		return lowerName as Category;
	}

	// Partial match
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

/**
 * Get quote text in a specific language
 */
export function getQuoteText(quote: Quote, language: SupportedLanguage = 'de'): string {
	if (language === 'original') {
		return quote.text.original;
	}
	return quote.text[language];
}

/**
 * Format a quote for display
 */
export function formatQuote(quote: Quote, language: SupportedLanguage = 'de'): string {
	const text = getQuoteText(quote, language);
	const categoryLabel = CATEGORY_LABELS[quote.category];
	return `"${text}"\n\n— *${quote.author}*\n\n[${categoryLabel}]`;
}

/**
 * Format a quote with number
 */
export function formatQuoteWithNumber(
	quote: Quote,
	number: number,
	language: SupportedLanguage = 'de'
): string {
	const text = getQuoteText(quote, language);
	const categoryLabel = CATEGORY_LABELS[quote.category];
	return `**#${number}**\n"${text}"\n\n— *${quote.author}* [${categoryLabel}]`;
}

/**
 * Get total quote count
 */
export function getTotalCount(): number {
	return QUOTES.length;
}

/**
 * Get quotes by tag
 */
export function getQuotesByTag(tag: string): Quote[] {
	const lowerTag = tag.toLowerCase();
	return QUOTES.filter((q) => q.tags?.some((t) => t.toLowerCase() === lowerTag));
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
	const tags = new Set<string>();
	QUOTES.forEach((q) => q.tags?.forEach((t) => tags.add(t)));
	return Array.from(tags).sort();
}

/**
 * Get quotes by author
 */
export function getQuotesByAuthor(author: string): Quote[] {
	const lowerAuthor = author.toLowerCase();
	return QUOTES.filter((q) => q.author.toLowerCase().includes(lowerAuthor));
}

/**
 * Get verified quotes only
 */
export function getVerifiedQuotes(): Quote[] {
	return QUOTES.filter((q) => q.verified === true);
}

/**
 * Get quotes by year range
 */
export function getQuotesByYearRange(startYear: number, endYear: number): Quote[] {
	return QUOTES.filter((q) => q.year !== undefined && q.year >= startYear && q.year <= endYear);
}

/**
 * Get quotes by original language
 */
export function getQuotesByOriginalLanguage(language: string): Quote[] {
	return QUOTES.filter((q) => q.originalLanguage === language);
}

// Helper function
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
}
