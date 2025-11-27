import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en.json';
import de from './translations/de.json';

const LANGUAGE_STORAGE_KEY = '@storyteller/language';

// Get device language with fallback
const locales = getLocales();
const deviceLanguage = locales[0]?.languageCode || 'en'; // e.g., 'en'

// Initialize i18n
i18n.use(initReactI18next).init({
	compatibilityJSON: 'v4', // Required for React Native
	resources: {
		en: { translation: en },
		de: { translation: de },
	},
	lng: deviceLanguage, // Default to device language
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false, // React already escapes values
	},
	react: {
		useSuspense: false, // Disable suspense for React Native
	},
});

// Load saved language preference
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLanguage) => {
	if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
		i18n.changeLanguage(savedLanguage);
	}
});

// Helper function to change and save language
export const changeLanguage = async (language: 'en' | 'de') => {
	await i18n.changeLanguage(language);
	await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

// Helper function to get current language
export const getCurrentLanguage = (): 'en' | 'de' => {
	return (i18n.language || 'en') as 'en' | 'de';
};

export default i18n;
