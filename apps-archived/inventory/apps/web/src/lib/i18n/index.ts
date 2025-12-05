import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';

export const supportedLocales = ['de', 'en', 'fr', 'es', 'it'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));
register('fr', () => import('./locales/fr.json'));
register('es', () => import('./locales/es.json'));
register('it', () => import('./locales/it.json'));

const storedLocale =
	typeof localStorage !== 'undefined' ? localStorage.getItem('inventory-locale') : null;

init({
	fallbackLocale: 'de',
	initialLocale: storedLocale || getLocaleFromNavigator() || 'de',
});

export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('inventory-locale', newLocale);
	}
}

export { locale };
