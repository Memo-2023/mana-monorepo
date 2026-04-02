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
		const [common, nav, dashboard, credits, profile, subscription, todo, app_slider] =
			await Promise.all([
				import(`./locales/common/${lang}.json`),
				import(`./locales/nav/${lang}.json`),
				import(`./locales/dashboard/${lang}.json`),
				import(`./locales/credits/${lang}.json`),
				import(`./locales/profile/${lang}.json`),
				import(`./locales/subscription/${lang}.json`),
				import(`./locales/todo/${lang}.json`),
				import(`./locales/app_slider/${lang}.json`),
			]);

		return {
			common: common.default,
			nav: nav.default,
			dashboard: dashboard.default,
			credits: credits.default,
			profile: profile.default,
			subscription: subscription.default,
			todo: todo.default,
			app_slider: app_slider.default,
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
