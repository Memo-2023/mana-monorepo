// Types
export type {
	Quote,
	TranslatedText,
	AuthorBio,
	SupportedLanguage,
	OriginalLanguage,
} from './types';
export { SUPPORTED_LANGUAGES, ORIGINAL_LANGUAGES } from './types';
export type { Category } from './categories';

// Data
export { QUOTES, QUOTE_COUNT } from './quotes';
export { CATEGORIES, CATEGORY_LABELS } from './categories';

// Utilities
export {
	getRandomQuote,
	getDailyQuote,
	getQuotesByCategory,
	getRandomQuoteByCategory,
	searchQuotes,
	getQuoteById,
	getQuoteByIndex,
	getAllCategories,
	getCategoryByName,
	getQuoteText,
	formatQuote,
	formatQuoteWithNumber,
	getTotalCount,
	getQuotesByTag,
	getAllTags,
	getQuotesByAuthor,
	getVerifiedQuotes,
	getQuotesByYearRange,
	getQuotesByOriginalLanguage,
} from './utils';

export { getCategoryLabel, isValidCategory } from './categories';
