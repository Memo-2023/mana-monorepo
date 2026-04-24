import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';
import { STORAGE_KEYS } from '$lib/config/storage-keys';

// List of supported locales
export const supportedLocales = ['de', 'en', 'it', 'fr', 'es'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Default locale
const defaultLocale = 'de';

// ─── Per-module locale registration ──────────────────────────
// Every folder under ./locales is one namespace; every <lang>.json
// inside is auto-registered via Vite's import.meta.glob. Adding a new
// namespace is a zero-code change: drop the folder + JSON files.

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json');

function registerLocale(lang: SupportedLocale) {
	register(lang, async () => {
		const suffix = `/${lang}.json`;
		const entries = await Promise.all(
			Object.entries(localeModules)
				.filter(([path]) => path.endsWith(suffix))
				.map(async ([path, loader]) => {
					const namespace = path.slice('./locales/'.length, -suffix.length);
					const mod = await loader();
					return [namespace, mod.default] as const;
				})
		);
		return Object.fromEntries(entries);
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
