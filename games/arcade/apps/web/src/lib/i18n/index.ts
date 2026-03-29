import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';

export const supportedLocales = ['de', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const defaultLocale = 'de';

register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));

function getInitialLocale(): SupportedLocale {
	if (browser) {
		const stored = localStorage.getItem('arcade_locale');
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

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale(),
});

export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem('arcade_locale', newLocale);
	}
}

export { waitLocale };
