import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';
import { STORAGE_KEYS } from '$lib/config/storage-keys';

// List of supported locales
export const supportedLocales = ['de', 'en', 'it', 'fr', 'es'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Default locale
const defaultLocale = 'de';

// ─── Per-module locale registration ──────────────────────────
// Each module has its own JSON file per language.
// They get merged into a single dictionary at registration time.

function registerLocale(lang: SupportedLocale) {
	register(lang, async () => {
		const [
			apps,
			common,
			nav,
			dashboard,
			credits,
			profile,
			subscription,
			todo,
			app_slider,
			calendar,
			contacts,
			chat,
			cards,
			picture,
			zitare,
			memoro,
			moodlit,
			storage,
			context,
			presi,
			uload,
			times,
			inventar,
			photos,
			nutriphi,
			planta,
			skilltree,
			citycorners,
			calc,
			questions,
			guides,
			help,
			cycles,
		] = await Promise.all([
			import(`./locales/apps/${lang}.json`),
			import(`./locales/common/${lang}.json`),
			import(`./locales/nav/${lang}.json`),
			import(`./locales/dashboard/${lang}.json`),
			import(`./locales/credits/${lang}.json`),
			import(`./locales/profile/${lang}.json`),
			import(`./locales/subscription/${lang}.json`),
			import(`./locales/todo/${lang}.json`),
			import(`./locales/app_slider/${lang}.json`),
			import(`./locales/calendar/${lang}.json`),
			import(`./locales/contacts/${lang}.json`),
			import(`./locales/chat/${lang}.json`),
			import(`./locales/cards/${lang}.json`),
			import(`./locales/picture/${lang}.json`),
			import(`./locales/zitare/${lang}.json`),
			import(`./locales/memoro/${lang}.json`),
			import(`./locales/moodlit/${lang}.json`),
			import(`./locales/storage/${lang}.json`),
			import(`./locales/context/${lang}.json`),
			import(`./locales/presi/${lang}.json`),
			import(`./locales/uload/${lang}.json`),
			import(`./locales/times/${lang}.json`),
			import(`./locales/inventar/${lang}.json`),
			import(`./locales/photos/${lang}.json`),
			import(`./locales/nutriphi/${lang}.json`),
			import(`./locales/planta/${lang}.json`),
			import(`./locales/skilltree/${lang}.json`),
			import(`./locales/citycorners/${lang}.json`),
			import(`./locales/calc/${lang}.json`),
			import(`./locales/questions/${lang}.json`),
			import(`./locales/guides/${lang}.json`),
			import(`./locales/help/${lang}.json`),
			import(`./locales/cycles/${lang}.json`),
		]);

		return {
			apps: apps.default,
			common: common.default,
			nav: nav.default,
			dashboard: dashboard.default,
			credits: credits.default,
			profile: profile.default,
			subscription: subscription.default,
			todo: todo.default,
			app_slider: app_slider.default,
			calendar: calendar.default,
			contacts: contacts.default,
			chat: chat.default,
			cards: cards.default,
			picture: picture.default,
			zitare: zitare.default,
			memoro: memoro.default,
			moodlit: moodlit.default,
			storage: storage.default,
			context: context.default,
			presi: presi.default,
			uload: uload.default,
			times: times.default,
			inventar: inventar.default,
			photos: photos.default,
			nutriphi: nutriphi.default,
			planta: planta.default,
			skilltree: skilltree.default,
			citycorners: citycorners.default,
			calc: calc.default,
			questions: questions.default,
			guides: guides.default,
			help: help.default,
			cycles: cycles.default,
		};
	});
}

for (const lang of supportedLocales) {
	registerLocale(lang);
}

// ─── Initialization ──────────────────────────────────────────

function getInitialLocale(): SupportedLocale {
	if (browser) {
		// Check localStorage first (pre-login fallback)
		const stored = localStorage.getItem(STORAGE_KEYS.LOCALE);
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

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale(),
});

// Set locale and persist to localStorage
export function setLocale(newLocale: SupportedLocale) {
	locale.set(newLocale);
	if (browser) {
		localStorage.setItem(STORAGE_KEYS.LOCALE, newLocale);
	}
}

// Wait for locale to be loaded (useful for SSR)
export { waitLocale };
