import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from '~/locales/en.json';
import de from '~/locales/de.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = [
	{ code: 'en', name: 'English', nativeName: 'English' },
	{ code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
	en: {
		translation: en,
	},
	de: {
		translation: de,
	},
};

// Get device language, fallback to English if not supported
function getDeviceLanguage(): SupportedLanguage {
	try {
		const locale = Localization.locale;
		if (!locale) return 'en';

		const languageCode = locale.split('-')[0] as SupportedLanguage;

		// Check if the language is supported
		const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === languageCode);

		return isSupported ? languageCode : 'en';
	} catch (error) {
		console.warn('Error getting device language:', error);
		return 'en';
	}
}

// Initialize i18n
i18n.use(initReactI18next).init({
	resources,
	lng: getDeviceLanguage(),
	fallbackLng: 'en',

	interpolation: {
		escapeValue: false, // React already escapes values
	},

	// Enable plurals
	pluralSeparator: '_',

	// Namespace configuration
	defaultNS: 'translation',

	// Debug mode - set to true during development
	debug: __DEV__,

	// React i18next options
	react: {
		useSuspense: false,
	},
});

export default i18n;

// Helper function to get current language
export const getCurrentLanguage = (): SupportedLanguage => {
	return i18n.language as SupportedLanguage;
};

// Helper function to change language
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
	await i18n.changeLanguage(language);
};

// Helper function to get language name
export const getLanguageName = (code: SupportedLanguage): string => {
	const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
	return lang?.nativeName || code;
};

// Helper function to check if language is supported
export const isLanguageSupported = (code: string): code is SupportedLanguage => {
	return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
};

// Helper function to get device locale info
export const getDeviceLocaleInfo = () => {
	return {
		locale: Localization.locale,
		locales: Localization.locales,
		timezone: Localization.timezone,
		isRTL: Localization.isRTL,
		region: Localization.region,
	};
};
