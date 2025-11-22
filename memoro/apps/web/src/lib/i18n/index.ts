import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';

// Register all available locales
register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));
register('fr', () => import('./locales/fr.json'));
register('it', () => import('./locales/it.json'));
register('es', () => import('./locales/es.json'));

// List of supported locales
export const supportedLocales = ['de', 'en', 'fr', 'it', 'es'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Default locale
const defaultLocale = 'en';

// Get initial locale from browser or localStorage
function getInitialLocale(): SupportedLocale {
	if (browser) {
		// Check localStorage first
		const stored = localStorage.getItem('locale');
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

// Initialize i18n
export function initI18n() {
	init({
		fallbackLocale: defaultLocale,
		initialLocale: getInitialLocale()
	});
}

// Set locale and persist to localStorage
export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem('locale', newLocale);
	}
}

// Wait for locale to be loaded (useful for SSR)
export { waitLocale };
