import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));

export function initI18n() {
	init({
		fallbackLocale: 'de',
		initialLocale: getLocaleFromNavigator()?.startsWith('de') ? 'de' : 'en',
	});
}
