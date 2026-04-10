import { QUOTES } from './quotes';
import {
	CATEGORIES,
	CATEGORY_LABELS,
	THEME_DECKS,
	type Category,
	type ThemeDeckId,
} from './categories';
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

// ─── Pre-built category index (built once, O(1) per lookup) ──

let _categoryIndex: Map<Category, Quote[]> | null = null;

function getCategoryIndex(): Map<Category, Quote[]> {
	if (!_categoryIndex) {
		_categoryIndex = new Map();
		for (const cat of CATEGORIES) _categoryIndex.set(cat, []);
		for (const q of QUOTES) _categoryIndex.get(q.category)?.push(q);
	}
	return _categoryIndex;
}

/**
 * Get quotes by category (uses pre-built index for O(1) lookups).
 */
export function getQuotesByCategory(category: Category): Quote[] {
	return getCategoryIndex().get(category) ?? [];
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

// ─── Pre-built author index ──────────────────────────────────

let _authorIndex: Map<string, Quote[]> | null = null;

function getAuthorIndex(): Map<string, Quote[]> {
	if (!_authorIndex) {
		_authorIndex = new Map();
		for (const q of QUOTES) {
			const key = q.author.toLowerCase();
			let arr = _authorIndex.get(key);
			if (!arr) {
				arr = [];
				_authorIndex.set(key, arr);
			}
			arr.push(q);
		}
	}
	return _authorIndex;
}

/**
 * Get quotes by author (substring match on name).
 */
export function getQuotesByAuthor(author: string): Quote[] {
	const lowerAuthor = author.toLowerCase();
	// Exact match via index first
	const exact = getAuthorIndex().get(lowerAuthor);
	if (exact) return exact;
	// Fall back to substring match across all authors
	const results: Quote[] = [];
	for (const [key, quotes] of getAuthorIndex()) {
		if (key.includes(lowerAuthor)) results.push(...quotes);
	}
	return results;
}

/** Author summary for browse pages. */
export interface AuthorInfo {
	name: string;
	quoteCount: number;
	categories: string[];
	bio?: { de?: string; en?: string; it?: string; fr?: string; es?: string };
}

/**
 * Get all unique authors with their quote counts, categories, and bios.
 * Sorted by quote count descending, then name ascending.
 */
export function getAllAuthors(): AuthorInfo[] {
	const map = new Map<string, AuthorInfo>();
	for (const q of QUOTES) {
		let info = map.get(q.author);
		if (!info) {
			info = { name: q.author, quoteCount: 0, categories: [], bio: q.authorBio };
			map.set(q.author, info);
		}
		info.quoteCount++;
		if (!info.categories.includes(q.category)) {
			info.categories.push(q.category);
		}
		// Prefer the bio entry that has content
		if (!info.bio && q.authorBio) info.bio = q.authorBio;
	}
	return Array.from(map.values()).sort(
		(a, b) => b.quoteCount - a.quoteCount || a.name.localeCompare(b.name)
	);
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

/**
 * Get quotes for a curated theme deck.
 */
export function getQuotesByThemeDeck(deckId: ThemeDeckId): Quote[] {
	const deck = THEME_DECKS.find((d) => d.id === deckId);
	if (!deck) return [];
	const authorSet = new Set(deck.authors.map((a) => a.toLowerCase()));
	return QUOTES.filter((q) => authorSet.has(q.author.toLowerCase()));
}

/**
 * Fuzzy search — matches even with typos using bigram similarity.
 * Falls back to simple substring match for short queries.
 */
export function fuzzySearchQuotes(
	query: string,
	language: SupportedLanguage = 'de',
	threshold = 0.3
): Quote[] {
	const normalizedQuery = query.toLowerCase().trim();
	if (!normalizedQuery) return [];

	// For very short queries (1-2 chars), use exact substring
	if (normalizedQuery.length <= 2) return searchQuotes(query, language);

	const queryBigrams = toBigrams(normalizedQuery);

	return QUOTES.filter((q) => {
		const text = language === 'original' ? q.text.original : q.text[language];
		const haystack = `${text} ${q.author}`.toLowerCase();

		// Fast path: exact substring match
		if (haystack.includes(normalizedQuery)) return true;

		// Check individual words for fuzzy match
		const queryWords = normalizedQuery.split(/\s+/);
		return queryWords.every((word) => {
			if (haystack.includes(word)) return true;
			if (word.length <= 2) return false;
			const wordBigrams = toBigrams(word);
			// Check if any word in the haystack has high bigram similarity
			return haystack.split(/\s+/).some((hw) => {
				if (hw.length <= 2) return false;
				return bigramSimilarity(wordBigrams, toBigrams(hw)) >= threshold;
			});
		});
	});
}

function toBigrams(s: string): Set<string> {
	const bigrams = new Set<string>();
	for (let i = 0; i < s.length - 1; i++) {
		bigrams.add(s.slice(i, i + 2));
	}
	return bigrams;
}

function bigramSimilarity(a: Set<string>, b: Set<string>): number {
	let intersection = 0;
	for (const bigram of a) {
		if (b.has(bigram)) intersection++;
	}
	return (2 * intersection) / (a.size + b.size);
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
