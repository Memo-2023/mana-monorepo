import { browser } from '$app/environment';
import { locale } from 'svelte-i18n';
import { get } from 'svelte/store';
import '$lib/i18n'; // Initialize i18n

export function initLocale() {
	if (browser) {
		const savedLang = localStorage.getItem('preferred-language');
		const browserLang = navigator.language.split('-')[0];
		const supportedLangs = ['en', 'de', 'it', 'fr', 'es'];

		let targetLang = 'en'; // default

		if (savedLang && supportedLangs.includes(savedLang)) {
			targetLang = savedLang;
		} else if (supportedLangs.includes(browserLang)) {
			targetLang = browserLang;
		}

		try {
			locale.set(targetLang);
		} catch (e) {
			console.warn('Failed to set locale:', e);
			locale.set('en');
		}
	}
}

export function getCurrentLocale(): string {
	try {
		return get(locale) || 'en';
	} catch {
		return 'en';
	}
}

export function setCurrentLocale(lang: string) {
	locale.set(lang);
	if (browser) {
		localStorage.setItem('preferred-language', lang);
	}
}
