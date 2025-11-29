import { ui, defaultLang, languages } from '../i18n/ui';

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang in languages) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: keyof (typeof ui)[typeof defaultLang]) {
		try {
			// First check if the lang object exists
			if (ui[lang] === undefined) {
				// If requested language doesn't exist, safely fall back to default
				return ui[defaultLang]?.[key] || `[Missing: ${key}]`;
			}

			// Try to get the translation in the requested language, fall back to default
			return ui[lang][key] || ui[defaultLang]?.[key] || `[Missing: ${key}]`;
		} catch (error) {
			console.error(`Translation error for key "${String(key)}" in language "${lang}":`, error);
			return `[Error: ${key}]`;
		}
	};
}
