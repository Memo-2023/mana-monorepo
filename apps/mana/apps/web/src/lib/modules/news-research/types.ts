export interface DiscoveredFeedDto {
	url: string;
	title: string | null;
	type: 'rss' | 'atom' | 'unknown';
	siteUrl: string | null;
	sourceHit?: string;
}

export interface FeedValidationDto {
	ok: boolean;
	itemCount: number;
	title: string | null;
	sample: Array<{
		url: string;
		title: string;
		excerpt: string | null;
		publishedAt: string | null;
	}>;
	error?: string;
}

export interface ScoredArticleDto {
	url: string;
	title: string;
	excerpt: string | null;
	content: string | null;
	htmlContent: string | null;
	author: string | null;
	imageUrl: string | null;
	publishedAt: string | null;
	feedUrl: string;
	score: number;
}

export interface ExtractedArticleDto {
	url: string;
	title: string | null;
	content: string;
	htmlContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

export interface ResearchSession {
	id: string;
	query: string;
	siteUrl: string | null;
	discoveredFeeds: DiscoveredFeedDto[];
	selectedFeeds: string[];
	results: ScoredArticleDto[];
	createdAt: number;
	/** True once a discovery run has completed (success or empty). */
	hasDiscovered: boolean;
	/** True once a search run has completed. */
	hasSearched: boolean;
}
