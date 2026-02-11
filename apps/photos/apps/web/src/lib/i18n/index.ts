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
		const stored = localStorage.getItem('photos_locale');
		if (stored && supportedLocales.includes(stored as SupportedLocale)) {
			return stored as SupportedLocale;
		}

		const browserLang = navigator.language.split('-')[0];
		if (supportedLocales.includes(browserLang as SupportedLocale)) {
			return browserLang as SupportedLocale;
		}
	}

	return defaultLocale;
}

// Initialize i18n
init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale(),
});

// Set locale and persist
export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem('photos_locale', newLocale);
	}
}

export { waitLocale };
