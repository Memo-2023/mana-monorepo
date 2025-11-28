/**
 * Content Loader Type Definitions
 * Exportiert nur die TypeScript-Interfaces für Quotes und Authors
 */

export interface Author {
	id: string;
	name: string;
	profession?: string[];
	biography?: {
		short: string;
		long?: string;
		sections?: { [key: string]: any };
		keyAchievements?: string[];
		famousQuote?: string;
	};
	lifespan?: {
		birth: string;
		death?: string;
	};
	verified?: boolean;
	lastVerified?: string; // ISO 8601 date string (YYYY-MM-DD)
	featured?: boolean;
	imageUrl?: string;
	image?: {
		thumbnail?: string;
		full?: string;
		credit?: string;
		source?: string;
	};
}

export interface EnhancedQuote {
	id: string;
	text: string;
	authorId: string;
	author?: Author;
	categories?: string[];
	tags?: string[];
	featured?: boolean;
	likes?: number;
	isFavorite?: boolean;
	source?: string;
	year?: number;
	language?: string;
	category?: string;
	verified?: boolean;
	lastVerified?: string; // ISO 8601 date string (YYYY-MM-DD)
	verificationNotes?: string; // Optional: Notes about verification status
}
