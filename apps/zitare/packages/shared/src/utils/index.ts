/**
 * Shared Utility Functions
 *
 * Generic utilities that work with any content type (quotes, proverbs, poems, etc.)
 */

import type { ContentItem, ContentAuthor } from '../types';

// ============================================================================
// AUTHOR/CREATOR UTILITIES
// ============================================================================

/**
 * Format author/creator name
 */
export function formatAuthorName(author: ContentAuthor): string {
	return author.name;
}

/**
 * Get author/creator lifespan string
 */
export function getAuthorLifespan(author: ContentAuthor): string {
	if (!author.lifespan) return '';
	const { birth, death } = author.lifespan;
	return death ? `${birth} - ${death}` : `${birth} - Present`;
}

// ============================================================================
// CONTENT FILTERING - Generic functions that work with any ContentItem
// ============================================================================

/**
 * Filter content items by category
 */
export function filterContentByCategory<T extends ContentItem>(items: T[], category: string): T[] {
	return items.filter((item) => item.category === category || item.categories?.includes(category));
}

/**
 * Filter content items by tag
 */
export function filterContentByTag<T extends ContentItem>(items: T[], tag: string): T[] {
	return items.filter((item) => item.tags?.includes(tag));
}

/**
 * Filter content items by author
 */
export function filterContentByAuthor<T extends ContentItem>(items: T[], authorId: string): T[] {
	return items.filter((item) => item.authorId === authorId);
}

/**
 * Get random content item from array
 */
export function getRandomContent<T extends ContentItem>(items: T[]): T | undefined {
	if (items.length === 0) return undefined;
	return items[Math.floor(Math.random() * items.length)];
}

/**
 * Search content items by text
 */
export function searchContent<T extends ContentItem>(items: T[], searchTerm: string): T[] {
	const term = searchTerm.toLowerCase();
	return items.filter(
		(item) =>
			item.text.toLowerCase().includes(term) ||
			item.tags?.some((tag) => tag.toLowerCase().includes(term))
	);
}

/**
 * Get unique categories from content items
 */
export function getUniqueCategories<T extends ContentItem>(items: T[]): string[] {
	const categories = new Set<string>();
	items.forEach((item) => {
		if (item.category) categories.add(item.category);
		item.categories?.forEach((cat) => categories.add(cat));
	});
	return Array.from(categories).sort();
}

/**
 * Get unique tags from content items
 */
export function getUniqueTags<T extends ContentItem>(items: T[]): string[] {
	const tags = new Set<string>();
	items.forEach((item) => {
		item.tags?.forEach((tag) => tags.add(tag));
	});
	return Array.from(tags).sort();
}

/**
 * Group content items by category
 */
export function groupContentByCategory<T extends ContentItem>(items: T[]): Record<string, T[]> {
	const grouped: Record<string, T[]> = {};

	items.forEach((item) => {
		const categories = item.categories || (item.category ? [item.category] : ['uncategorized']);
		categories.forEach((category) => {
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(item);
		});
	});

	return grouped;
}

/**
 * Get featured content items
 */
export function getFeaturedContent<T extends ContentItem>(items: T[]): T[] {
	return items.filter((item) => item.featured === true);
}

/**
 * Get favorite content items
 */
export function getFavoriteContent<T extends ContentItem>(items: T[]): T[] {
	return items.filter((item) => item.isFavorite === true);
}

// ============================================================================
// BACKWARD COMPATIBILITY - Quote-specific aliases
// ============================================================================

import type { Quote } from '../types';

/**
 * @deprecated Use filterContentByCategory instead
 */
export const filterQuotesByCategory = filterContentByCategory<Quote>;

/**
 * @deprecated Use filterContentByTag instead
 */
export const filterQuotesByTag = filterContentByTag<Quote>;

/**
 * @deprecated Use getRandomContent instead
 */
export const getRandomQuote = getRandomContent<Quote>;

/**
 * @deprecated Use searchContent instead
 */
export const searchQuotes = searchContent<Quote>;
