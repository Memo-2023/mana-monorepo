export interface NormalizedFeedItem {
	url: string;
	title: string;
	excerpt: string | null;
	content: string | null;
	htmlContent: string | null;
	author: string | null;
	imageUrl: string | null;
	publishedAt: Date | null;
}

export interface ExtractedArticle {
	title: string | null;
	content: string;
	htmlContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

export interface DiscoveredFeed {
	url: string;
	title: string | null;
	type: 'rss' | 'atom' | 'unknown';
	siteUrl: string | null;
}

export interface FeedValidation {
	ok: boolean;
	itemCount: number;
	title: string | null;
	sample: NormalizedFeedItem[];
	error?: string;
}

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; ManaRSS/1.0; +https://mana.how)';
