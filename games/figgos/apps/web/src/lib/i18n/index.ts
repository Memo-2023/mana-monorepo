import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';

export const supportedLocales = ['en', 'de'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));

function getInitialLocale(): SupportedLocale {
	if (browser) {
		const stored = localStorage.getItem('figgos_locale');
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
		localStorage.setItem('figgos_locale', newLocale);
	}
}

export { waitLocale };
