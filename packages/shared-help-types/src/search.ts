/**
 * Search-related Type Definitions
 */

import type { FAQItem, FeatureItem, GettingStartedItem, ChangelogItem } from './content.js';

// ============================================================================
// Searchable Item Types
// ============================================================================

export type SearchableContentType = 'faq' | 'feature' | 'guide' | 'changelog';

export interface SearchableItem {
	id: string;
	type: SearchableContentType;
	title: string;
	content: string;
	tags?: string[];
	question?: string;
	description?: string;
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
	id: string;
	type: SearchableContentType;
	title: string;
	excerpt: string;
	score: number;
	highlight?: string;
	/** Original item reference */
	item: FAQItem | FeatureItem | GettingStartedItem | ChangelogItem;
}

export interface SearchOptions {
	/** Maximum number of results to return */
	limit?: number;
	/** Minimum score threshold (0-1, lower is more strict) */
	threshold?: number;
	/** Filter by content type */
	types?: SearchableContentType[];
	/** Filter by app ID (for app-specific content) */
	appId?: string;
}

export interface SearchIndexConfig {
	/** Weight for title/question field */
	titleWeight?: number;
	/** Weight for content field */
	contentWeight?: number;
	/** Weight for tags field */
	tagsWeight?: number;
	/** Fuzzy match threshold (0-1, lower is more strict) */
	threshold?: number;
	/** Minimum characters to start searching */
	minMatchCharLength?: number;
}

// ============================================================================
// Search State Types (for UI)
// ============================================================================

export interface SearchState {
	query: string;
	results: SearchResult[];
	isSearching: boolean;
	hasSearched: boolean;
}
