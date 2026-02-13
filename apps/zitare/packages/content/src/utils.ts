import { QUOTES } from './quotes';
import { CATEGORIES, CATEGORY_LABELS, type Category } from './categories';
import type { Quote } from './types';

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
 * Search quotes by text or author
 */
export function searchQuotes(searchText: string): Quote[] {
	const lowerSearch = searchText.toLowerCase();
	return QUOTES.filter(
		(q) =>
			q.text.toLowerCase().includes(lowerSearch) || q.author.toLowerCase().includes(lowerSearch)
	);
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
 * Format a quote for display
 */
export function formatQuote(quote: Quote): string {
	const categoryLabel = CATEGORY_LABELS[quote.category];
	return `"${quote.text}"\n\n— *${quote.author}*\n\n[${categoryLabel}]`;
}

/**
 * Format a quote with number
 */
export function formatQuoteWithNumber(quote: Quote, number: number): string {
	const categoryLabel = CATEGORY_LABELS[quote.category];
	return `**#${number}**\n"${quote.text}"\n\n— *${quote.author}* [${categoryLabel}]`;
}

/**
 * Get total quote count
 */
export function getTotalCount(): number {
	return QUOTES.length;
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
