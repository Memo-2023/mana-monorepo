/**
 * Shared i18n utilities for landing pages
 */

export * from './types';

import {
	type Language,
	type CommonTranslations,
	type Translations,
	languages,
	defaultLang,
	defaultCommonTranslations,
} from './types';

/**
 * Get the language from a URL pathname
 * Supports both /en/page and /page patterns
 */
export function getLangFromUrl(url: URL): Language {
	const [, lang] = url.pathname.split('/');
	if (lang && lang in languages) {
		return lang as Language;
	}
	return defaultLang;
}

/**
 * Get the route without the language prefix
 */
export function getRouteFromUrl(url: URL): string {
	const pathname = url.pathname;
	const [, lang, ...rest] = pathname.split('/');

	if (lang && lang in languages) {
		return '/' + rest.join('/') || '/';
	}
	return pathname;
}

/**
 * Create a localized path
 */
export function localizePath(path: string, lang: Language): string {
	// If the language is the default language, don't add a prefix
	if (lang === defaultLang) {
		return path;
	}
	// Ensure path starts with /
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `/${lang}${normalizedPath}`;
}

/**
 * Create a translation function for a specific language
 */
export function useTranslations<T extends CommonTranslations>(
	lang: Language,
	translations: Translations<T>
): (key: keyof T | string) => string {
	return function t(key: keyof T | string): string {
		const langTranslations = translations[lang];
		if (langTranslations && key in langTranslations) {
			return langTranslations[key as keyof T] as string;
		}
		// Fallback to default language
		const defaultTranslations = translations[defaultLang];
		if (defaultTranslations && key in defaultTranslations) {
			return defaultTranslations[key as keyof T] as string;
		}
		// Return the key as fallback
		return String(key);
	};
}

/**
 * Create a translation function with merged common translations
 */
export function createTranslations<T extends CommonTranslations>(
	lang: Language,
	appTranslations: Translations<T>
): (key: keyof T | string) => string {
	// Merge app translations with common translations
	const mergedTranslations = {} as Translations<T>;

	for (const l of Object.keys(languages) as Language[]) {
		mergedTranslations[l] = {
			...defaultCommonTranslations[l],
			...appTranslations[l],
		} as T;
	}

	return useTranslations(lang, mergedTranslations);
}

/**
 * Get alternate language links for SEO (hreflang)
 */
export function getAlternateLinks(url: URL): Array<{ lang: Language; href: string }> {
	const route = getRouteFromUrl(url);
	const baseUrl = `${url.protocol}//${url.host}`;

	return (Object.keys(languages) as Language[]).map((lang) => ({
		lang,
		href: `${baseUrl}${localizePath(route, lang)}`,
	}));
}

/**
 * Detect browser language preference
 */
export function getBrowserLang(): Language {
	if (typeof navigator === 'undefined') {
		return defaultLang;
	}

	const browserLang = navigator.language.split('-')[0];
	if (browserLang in languages) {
		return browserLang as Language;
	}

	return defaultLang;
}

/**
 * Format a date according to the locale
 */
export function formatDate(date: Date, lang: Language): string {
	const localeMap: Record<Language, string> = {
		de: 'de-DE',
		en: 'en-US',
		fr: 'fr-FR',
		it: 'it-IT',
		es: 'es-ES',
	};

	return date.toLocaleDateString(localeMap[lang], {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Format a number according to the locale
 */
export function formatNumber(num: number, lang: Language): string {
	const localeMap: Record<Language, string> = {
		de: 'de-DE',
		en: 'en-US',
		fr: 'fr-FR',
		it: 'it-IT',
		es: 'es-ES',
	};

	return num.toLocaleString(localeMap[lang]);
}

/**
 * Format currency according to the locale
 */
export function formatCurrency(amount: number, lang: Language, currency = 'EUR'): string {
	const localeMap: Record<Language, string> = {
		de: 'de-DE',
		en: 'en-US',
		fr: 'fr-FR',
		it: 'it-IT',
		es: 'es-ES',
	};

	return new Intl.NumberFormat(localeMap[lang], {
		style: 'currency',
		currency,
	}).format(amount);
}
