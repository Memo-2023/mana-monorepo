/**
 * i18n setup for Mail app
 * Supports: DE, EN, FR, ES, IT
 */

import { browser } from '$app/environment';
import { init, register, locale, getLocaleFromNavigator } from 'svelte-i18n';

// Supported locales
export const supportedLocales = ['de', 'en', 'fr', 'es', 'it'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Register locales
register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));
register('fr', () => import('./locales/fr.json'));
register('es', () => import('./locales/es.json'));
register('it', () => import('./locales/it.json'));

// Get initial locale
function getInitialLocale(): SupportedLocale {
	if (browser) {
		// Check localStorage first
		const saved = localStorage.getItem('mail-locale');
		if (saved && supportedLocales.includes(saved as SupportedLocale)) {
			return saved as SupportedLocale;
		}

		// Fall back to browser language
		const browserLocale = getLocaleFromNavigator();
		if (browserLocale) {
			const shortLocale = browserLocale.split('-')[0] as SupportedLocale;
			if (supportedLocales.includes(shortLocale)) {
				return shortLocale;
			}
		}
	}

	// Default to German
	return 'de';
}

// Initialize i18n at module scope (required for SSR)
init({
	fallbackLocale: 'de',
	initialLocale: getInitialLocale(),
});

// Set locale and persist
export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem('mail-locale', newLocale);
	}
}

// Wait for locale to be loaded (useful for SSR)
export { waitLocale } from 'svelte-i18n';
