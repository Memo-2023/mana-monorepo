import i18next from 'i18next';

// Import translation files
import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';
import frTranslation from './locales/fr/translation.json';
import itTranslation from './locales/it/translation.json';
import esTranslation from './locales/es/translation.json';

// Get current language from browser or localStorage
const getBrowserLanguage = (): string => {
	if (typeof window === 'undefined') return 'en';

	const stored = localStorage.getItem('language');
	if (stored) return stored;

	const browserLang = navigator.language.split('-')[0];
	const supportedLanguages = ['en', 'de', 'fr', 'it', 'es'];
	return supportedLanguages.includes(browserLang) ? browserLang : 'en';
};

// Initialize i18next
if (!i18next.isInitialized) {
	i18next.init({
		lng: getBrowserLanguage(),
		fallbackLng: 'en',
		resources: {
			en: {
				translation: enTranslation,
			},
			de: {
				translation: deTranslation,
			},
			fr: {
				translation: frTranslation,
			},
			it: {
				translation: itTranslation,
			},
			es: {
				translation: esTranslation,
			},
		},
		interpolation: {
			escapeValue: false,
		},
	});
}

export default i18next;
export const t = i18next.t.bind(i18next);

// Change language function
export const changeLanguage = (lang: string) => {
	i18next.changeLanguage(lang);
	if (typeof window !== 'undefined') {
		localStorage.setItem('language', lang);
		window.location.reload();
	}
};

// Simple localizePath function
export const localizePath = (path: string, locale?: string) => path;
