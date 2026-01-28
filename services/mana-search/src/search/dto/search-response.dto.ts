export interface SearchResult {
	url: string;
	title: string;
	snippet: string;
	engine: string;
	score: number;
	publishedDate?: string;
	thumbnail?: string;
	category: string;
}

export interface SearchMeta {
	query: string;
	totalResults: number;
	engines: string[];
	duration: number;
	cached: boolean;
	cacheKey?: string;
}

export interface SearchResponse {
	results: SearchResult[];
	meta: SearchMeta;
}
