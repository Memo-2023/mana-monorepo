import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n';

import de from './locales/de.json';
import en from './locales/en.json';

const LOCALE_KEY = 'guides_locale';

addMessages('de', de);
addMessages('en', en);

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null;
const locale = saved ?? getLocaleFromNavigator() ?? 'de';

init({
	fallbackLocale: 'de',
	initialLocale: locale.startsWith('de') ? 'de' : 'en',
});

export function setLocale(lang: 'de' | 'en') {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(LOCALE_KEY, lang);
	}
}
