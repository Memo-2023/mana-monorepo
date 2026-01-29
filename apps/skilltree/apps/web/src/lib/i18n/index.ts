import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';

// List of supported locales
export const supportedLocales = ['de', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Default locale
const defaultLocale = 'de';

// Register all available locales
register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));

// Get initial locale from browser or localStorage
function getInitialLocale(): SupportedLocale {
	if (browser) {
		// Check localStorage first
		const stored = localStorage.getItem('skilltree_locale');
		if (stored && supportedLocales.includes(stored as SupportedLocale)) {
			return stored as SupportedLocale;
		}

		// Fall back to browser language
		const browserLang = navigator.language.split('-')[0];
		if (supportedLocales.includes(browserLang as SupportedLocale)) {
			return browserLang as SupportedLocale;
		}
	}

	return defaultLocale;
}

// Initialize i18n at module scope (required for SSR)
init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale(),
});

// Set locale and persist to localStorage
export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem('skilltree_locale', newLocale);
	}
}

// Wait for locale to be loaded (useful for SSR)
export { waitLocale };
