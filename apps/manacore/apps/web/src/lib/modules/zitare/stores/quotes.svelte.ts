/**
 * Quotes Store - Manages quote display state
 */

import { browser } from '$app/environment';
import {
	QUOTES,
	getDailyQuote,
	getRandomQuote,
	getQuotesByCategory,
	searchQuotes,
	getQuoteText,
	type Quote,
	type Category,
	type SupportedLanguage,
} from '@zitare/content';

// State
let currentQuote = $state<Quote | null>(null);
let language = $state<SupportedLanguage>('de');

// Get stored language or detect from browser
function getInitialLanguage(): SupportedLanguage {
	if (browser) {
		const stored = localStorage.getItem('zitare_quote_language');
		if (stored && ['de', 'en', 'it', 'fr', 'es', 'original'].includes(stored)) {
			return stored as SupportedLanguage;
		}

		// Map browser language to supported language
		const browserLang = navigator.language.split('-')[0];
		const langMap: Record<string, SupportedLanguage> = {
			de: 'de',
			en: 'en',
			it: 'it',
			fr: 'fr',
			es: 'es',
		};
		return langMap[browserLang] || 'de';
	}
	return 'de';
}

export const quotesStore = {
	get currentQuote() {
		return currentQuote;
	},
	get language() {
		return language;
	},
	get allQuotes() {
		return QUOTES;
	},
	get totalCount() {
		return QUOTES.length;
	},

	/**
	 * Initialize the store
	 */
	initialize() {
		language = getInitialLanguage();
		currentQuote = getDailyQuote();
	},

	/**
	 * Set the display language
	 */
	setLanguage(lang: SupportedLanguage) {
		language = lang;
		if (browser) {
			localStorage.setItem('zitare_quote_language', lang);
		}
	},

	/**
	 * Get quote text in current language
	 */
	getText(quote: Quote): string {
		return getQuoteText(quote, language);
	},

	/**
	 * Load the daily quote
	 */
	loadDailyQuote() {
		currentQuote = getDailyQuote();
	},

	/**
	 * Load a random quote
	 */
	loadRandomQuote() {
		currentQuote = getRandomQuote();
	},

	/**
	 * Get quotes by category
	 */
	getByCategory(category: Category): Quote[] {
		return getQuotesByCategory(category);
	},

	/**
	 * Search quotes
	 */
	search(query: string): Quote[] {
		return searchQuotes(query, language);
	},

	/**
	 * Set current quote
	 */
	setCurrentQuote(quote: Quote) {
		currentQuote = quote;
	},
};
