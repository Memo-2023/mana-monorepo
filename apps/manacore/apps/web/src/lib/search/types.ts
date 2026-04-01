/**
 * Cross-App Search — Type Definitions
 *
 * Provider-based search architecture: each app registers a SearchProvider
 * that knows how to search its own IndexedDB data and return ranked results.
 */

export interface SearchResult {
	/** Unique ID (usually the record ID) */
	id: string;
	/** Content type (e.g. 'task', 'event', 'contact') */
	type: string;
	/** Owning app ID (e.g. 'todo', 'calendar') */
	appId: string;
	/** Primary display text */
	title: string;
	/** Secondary text (description snippet, date, etc.) */
	subtitle?: string;
	/** App icon (data URL) */
	appIcon?: string;
	/** App brand color */
	appColor?: string;
	/** Navigation URL */
	href: string;
	/** Relevance score (0–1) */
	score: number;
	/** Which field matched */
	matchedField?: string;
}

export interface SearchOptions {
	/** Max results per provider (default: 5) */
	limit?: number;
	/** Filter to specific app IDs */
	appIds?: string[];
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
}

export interface SearchProvider {
	/** App identifier */
	appId: string;
	/** Display name */
	appName: string;
	/** App icon (data URL) */
	appIcon?: string;
	/** App brand color */
	appColor?: string;
	/** Content types this provider can search (for filter UI) */
	searchableTypes: string[];
	/** Execute search against this provider's data */
	search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export interface GroupedSearchResults {
	appId: string;
	appName: string;
	appIcon?: string;
	appColor?: string;
	results: SearchResult[];
}
