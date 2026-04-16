/**
 * Quote categories
 */
declare const CATEGORIES: readonly ["motivation", "weisheit", "liebe", "leben", "erfolg", "glueck", "freundschaft", "mut", "hoffnung", "natur", "humor", "wissenschaft", "kunst"];
type Category = (typeof CATEGORIES)[number];
/**
 * German labels for categories
 */
declare const CATEGORY_LABELS: Record<Category, string>;
/** Curated theme decks — cross-category collections around a topic. */
declare const THEME_DECKS: readonly [{
    readonly id: "stoizismus";
    readonly label: "Stoizismus";
    readonly description: "Gelassenheit und innere Stärke";
    readonly authors: readonly ["Marcus Aurelius", "Seneca", "Epiktet"];
}, {
    readonly id: "feminismus";
    readonly label: "Feminismus";
    readonly description: "Gleichberechtigung und Selbstbestimmung";
    readonly authors: readonly ["Simone de Beauvoir", "Virginia Woolf", "Maya Angelou", "Marie Curie", "Frida Kahlo"];
}, {
    readonly id: "unternehmertum";
    readonly label: "Unternehmertum";
    readonly description: "Innovation und Durchhaltevermögen";
    readonly authors: readonly ["Steve Jobs", "Henry Ford", "Thomas Edison", "Walt Disney"];
}, {
    readonly id: "philosophie";
    readonly label: "Philosophie";
    readonly description: "Die großen Fragen des Lebens";
    readonly authors: readonly ["Sokrates", "Platon", "Aristoteles", "Immanuel Kant", "Friedrich Nietzsche", "Konfuzius", "Laozi"];
}, {
    readonly id: "literatur";
    readonly label: "Literatur";
    readonly description: "Worte der großen Dichter und Schriftsteller";
    readonly authors: readonly ["Johann Wolfgang von Goethe", "Oscar Wilde", "Mark Twain", "William Shakespeare", "Rainer Maria Rilke"];
}];
type ThemeDeckId = (typeof THEME_DECKS)[number]['id'];
/**
 * Get label for a category
 */
declare function getCategoryLabel(category: Category): string;
/**
 * Check if a string is a valid category
 */
declare function isValidCategory(value: string): value is Category;

/**
 * Supported languages for quote translations
 */
declare const SUPPORTED_LANGUAGES: readonly ["original", "de", "en", "it", "fr", "es"];
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
/**
 * Original language of a quote
 */
declare const ORIGINAL_LANGUAGES: readonly ["de", "en", "fr", "es", "it", "la", "el", "zh", "sa", "ar", "fa", "ja", "ru", "pt", "nl", "da", "hi", "bn"];
type OriginalLanguage = (typeof ORIGINAL_LANGUAGES)[number];
/**
 * Translated text object
 */
interface TranslatedText {
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
interface AuthorBio {
    de?: string;
    en?: string;
    it?: string;
    fr?: string;
    es?: string;
}
/**
 * A quote with author, translations, and metadata
 */
interface Quote {
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
 * German inspirational quotes collection with multilingual support
 */
declare const QUOTES: Quote[];
/**
 * Total number of quotes
 */
declare const QUOTE_COUNT: number;

/**
 * Get a random quote
 */
declare function getRandomQuote(): Quote;
/**
 * Get deterministic daily quote based on date
 */
declare function getDailyQuote(date?: Date): Quote;
/**
 * Get quotes by category (uses pre-built index for O(1) lookups).
 */
declare function getQuotesByCategory(category: Category): Quote[];
/**
 * Get a random quote from a specific category
 */
declare function getRandomQuoteByCategory(category: Category): Quote | null;
/**
 * Search quotes by text or author (searches in specified language, defaults to German)
 */
declare function searchQuotes(searchText: string, language?: SupportedLanguage): Quote[];
/**
 * Get a quote by ID
 */
declare function getQuoteById(id: string): Quote | undefined;
/**
 * Get quote by index (1-based)
 */
declare function getQuoteByIndex(index: number): Quote | null;
/**
 * Get all categories with counts
 */
declare function getAllCategories(): {
    category: Category;
    label: string;
    count: number;
}[];
/**
 * Find category by name (partial match)
 */
declare function getCategoryByName(name: string): Category | null;
/**
 * Get quote text in a specific language
 */
declare function getQuoteText(quote: Quote, language?: SupportedLanguage): string;
/**
 * Format a quote for display
 */
declare function formatQuote(quote: Quote, language?: SupportedLanguage): string;
/**
 * Format a quote with number
 */
declare function formatQuoteWithNumber(quote: Quote, number: number, language?: SupportedLanguage): string;
/**
 * Get total quote count
 */
declare function getTotalCount(): number;
/**
 * Get quotes by tag
 */
declare function getQuotesByTag(tag: string): Quote[];
/**
 * Get all unique tags
 */
declare function getAllTags(): string[];
/**
 * Get quotes by author (substring match on name).
 */
declare function getQuotesByAuthor(author: string): Quote[];
/** Author summary for browse pages. */
interface AuthorInfo {
    name: string;
    quoteCount: number;
    categories: string[];
    bio?: {
        de?: string;
        en?: string;
        it?: string;
        fr?: string;
        es?: string;
    };
}
/**
 * Get all unique authors with their quote counts, categories, and bios.
 * Sorted by quote count descending, then name ascending.
 */
declare function getAllAuthors(): AuthorInfo[];
/**
 * Get verified quotes only
 */
declare function getVerifiedQuotes(): Quote[];
/**
 * Get quotes by year range
 */
declare function getQuotesByYearRange(startYear: number, endYear: number): Quote[];
/**
 * Get quotes by original language
 */
declare function getQuotesByOriginalLanguage(language: string): Quote[];
/**
 * Get quotes for a curated theme deck.
 */
declare function getQuotesByThemeDeck(deckId: ThemeDeckId): Quote[];
/**
 * Fuzzy search — matches even with typos using bigram similarity.
 * Falls back to simple substring match for short queries.
 */
declare function fuzzySearchQuotes(query: string, language?: SupportedLanguage, threshold?: number): Quote[];

export { type AuthorBio, type AuthorInfo, CATEGORIES, CATEGORY_LABELS, type Category, ORIGINAL_LANGUAGES, type OriginalLanguage, QUOTES, QUOTE_COUNT, type Quote, SUPPORTED_LANGUAGES, type SupportedLanguage, THEME_DECKS, type ThemeDeckId, type TranslatedText, formatQuote, formatQuoteWithNumber, fuzzySearchQuotes, getAllAuthors, getAllCategories, getAllTags, getCategoryByName, getCategoryLabel, getDailyQuote, getQuoteById, getQuoteByIndex, getQuoteText, getQuotesByAuthor, getQuotesByCategory, getQuotesByOriginalLanguage, getQuotesByTag, getQuotesByThemeDeck, getQuotesByYearRange, getRandomQuote, getRandomQuoteByCategory, getTotalCount, getVerifiedQuotes, isValidCategory, searchQuotes };
