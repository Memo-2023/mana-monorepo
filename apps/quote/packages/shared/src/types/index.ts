/**
 * Shared Type Definitions for Content Apps
 *
 * This file contains generalized types that can be used across
 * multiple content apps (quotes, proverbs, poems, etc.)
 */

// ============================================================================
// BASE TYPES - Generic for all content types
// ============================================================================

/**
 * Generic Author/Creator type
 * Can represent quote authors, poets, speakers, etc.
 */
export interface ContentAuthor {
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
	featured?: boolean;
	imageUrl?: string;
	image?: {
		thumbnail?: string;
		full?: string;
		credit?: string;
		source?: string;
	};
}

/**
 * Generic Content Item type with optional metadata
 * Base type for all content (quotes, proverbs, poems, etc.)
 */
export interface ContentItem<TMetadata = Record<string, any>> {
	id: string;
	text: string;
	authorId: string;
	author?: ContentAuthor;
	categories?: string[];
	tags?: string[];
	featured?: boolean;
	likes?: number;
	isFavorite?: boolean;
	language?: string;
	category?: string;
	metadata?: TMetadata;
}

/**
 * Generic Category type
 */
export interface ContentCategory {
	id: string;
	name: string;
	description?: string;
}

/**
 * Generic Tag type
 */
export interface ContentTag {
	id: string;
	name: string;
}

// ============================================================================
// SPECIFIC TYPES - Content-type specific implementations
// ============================================================================

/**
 * Quote-specific metadata
 */
export interface QuoteMetadata {
	source?: string;
	year?: number;
	context?: string;
	verified?: boolean;
}

/**
 * Quote type - extends ContentItem with quote-specific metadata
 */
export interface Quote extends ContentItem<QuoteMetadata> {
	source?: string;
	year?: number;
}

/**
 * Proverb-specific metadata
 */
export interface ProverbMetadata {
	origin?: string; // e.g., "Deutsches Sprichwort", "Chinese Proverb"
	meaning?: string; // Explanation of the proverb
	variants?: string[]; // Different versions of the proverb
	relatedProverbs?: string[]; // IDs of related proverbs
}

/**
 * Proverb type - extends ContentItem with proverb-specific metadata
 */
export interface Proverb extends ContentItem<ProverbMetadata> {
	origin?: string;
	meaning?: string;
	variants?: string[];
}

/**
 * Poem-specific metadata
 */
export interface PoemMetadata {
	verses?: string[]; // Individual stanzas/verses
	rhymeScheme?: string; // e.g., "ABAB", "AABB"
	form?: string; // e.g., "Sonnet", "Haiku"
	firstPublished?: number;
	collection?: string; // Name of the poetry collection
}

/**
 * Poem type - extends ContentItem with poem-specific metadata
 */
export interface Poem extends ContentItem<PoemMetadata> {
	verses?: string[];
	rhymeScheme?: string;
	form?: string;
}

/**
 * Speech-specific metadata
 */
export interface SpeechMetadata {
	date?: string; // Date of the speech
	location?: string; // Where it was given
	occasion?: string; // Context/occasion
	audience?: string; // Who it was for
	duration?: number; // Length in minutes
	videoUrl?: string; // Link to video if available
}

/**
 * Historical Speech type
 */
export interface Speech extends ContentItem<SpeechMetadata> {
	date?: string;
	location?: string;
	occasion?: string;
}

/**
 * Fable-specific metadata
 */
export interface FableMetadata {
	moral?: string; // The moral/lesson of the fable
	characters?: string[]; // Main characters (e.g., "Rabe", "Fuchs")
	setting?: string; // Where the fable takes place
	length?: 'short' | 'medium' | 'long'; // Length classification
	collection?: string; // Collection name if part of one
}

/**
 * Fable type - extends ContentItem with fable-specific metadata
 */
export interface Fable extends ContentItem<FableMetadata> {
	moral?: string;
	characters?: string[];
	setting?: string;
}

// ============================================================================
// BACKWARD COMPATIBILITY - Aliases for existing code
// ============================================================================

/**
 * @deprecated Use ContentAuthor instead
 * Kept for backward compatibility with existing quotes app
 */
export type Author = ContentAuthor;

/**
 * @deprecated Use Quote instead
 * Kept for backward compatibility with existing quotes app
 */
export type EnhancedQuote = Quote;

/**
 * @deprecated Use ContentCategory instead
 */
export type QuoteCategory = ContentCategory;

/**
 * @deprecated Use ContentTag instead
 */
export type QuoteTag = ContentTag;

// Export config types
export * from './config';
