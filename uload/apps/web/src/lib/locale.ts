import { browser } from '$app/environment';
import { setLocale, getLocale } from '$paraglide/runtime.js';

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
			setLocale(targetLang as any, { reload: false });
		} catch (e) {
			console.warn('Failed to set locale:', e);
			setLocale('en' as any, { reload: false });
		}
	}
}

export function getCurrentLocale() {
	try {
		return getLocale();
	} catch {
		return 'en';
	}
}
