export interface ExtractedImage {
	url: string;
	alt?: string;
}

export interface ExtractedLink {
	url: string;
	text: string;
	isExternal: boolean;
}

export interface ExtractedContent {
	title: string;
	description?: string;
	author?: string;
	publishedDate?: string;
	siteName?: string;

	// Content
	text: string;
	markdown?: string;
	html?: string;

	// Stats
	wordCount: number;
	readingTime: number;

	// Media
	images?: ExtractedImage[];
	links?: ExtractedLink[];

	// Meta
	ogImage?: string;
	ogType?: string;
	language?: string;
}

export interface ExtractMeta {
	url: string;
	duration: number;
	cached: boolean;
	contentType: string;
}

export interface ExtractResponse {
	success: boolean;
	content?: ExtractedContent;
	error?: string;
	meta: ExtractMeta;
}

export interface BulkExtractResult {
	url: string;
	success: boolean;
	content?: ExtractedContent;
	error?: string;
}

export interface BulkExtractResponse {
	results: BulkExtractResult[];
	meta: {
		total: number;
		successful: number;
		failed: number;
		duration: number;
	};
}
