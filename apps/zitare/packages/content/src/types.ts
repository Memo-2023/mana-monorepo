import type { Category } from './categories';

/**
 * Supported languages for quote translations
 */
export const SUPPORTED_LANGUAGES = ['original', 'de', 'en', 'it', 'fr', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Original language of a quote
 */
export const ORIGINAL_LANGUAGES = [
	'de', // German
	'en', // English
	'fr', // French
	'es', // Spanish
	'it', // Italian
	'la', // Latin
	'el', // Greek (ancient & modern)
	'zh', // Chinese
	'sa', // Sanskrit
	'ar', // Arabic
	'fa', // Persian
	'ja', // Japanese
	'ru', // Russian
	'pt', // Portuguese
	'nl', // Dutch
	'da', // Danish
	'hi', // Hindi
	'bn', // Bengali
] as const;
export type OriginalLanguage = (typeof ORIGINAL_LANGUAGES)[number];

/**
 * Translated text object
 */
export interface TranslatedText {
	/** Original language text */
	original: string;
	/** German translation */
	de: string;
	/** English translation */
	en: string;
	/** Italian translation */
	it: string;
	/** French translation */
	fr: string;
	/** Spanish translation */
	es: string;
}

/**
 * Author biography in multiple languages
 */
export interface AuthorBio {
	de?: string;
	en?: string;
	it?: string;
	fr?: string;
	es?: string;
}

/**
 * A quote with author, translations, and metadata
 */
export interface Quote {
	/** Unique identifier (e.g., 'mot-1', 'weis-2') */
	id: string;

	/** Quote text in all supported languages */
	text: TranslatedText;

	/** Author name */
	author: string;

	/** Category for filtering */
	category: Category;

	/** Original language of the quote */
	originalLanguage: OriginalLanguage;

	/** Source: book, speech, interview, letter, etc. */
	source?: string;

	/** Year the quote was made/published */
	year?: number;

	/** Additional tags for search/filtering */
	tags?: string[];

	/** URL to author image */
	imageUrl?: string;

	/** Short author biography */
	authorBio?: AuthorBio;

	/** Whether the quote source has been verified */
	verified?: boolean;
}

/**
 * Helper type for creating quotes with partial translations
 * (translations can be added incrementally)
 */
export type PartialQuote = Omit<Quote, 'text'> & {
	text: Partial<TranslatedText> & { original: string; de: string };
};
