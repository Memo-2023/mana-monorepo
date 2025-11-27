/**
 * i18n Configuration for Quotes App
 * Uses translations from the monorepo root i18n folder
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations from monorepo root
import de from '../../../../i18n/locales/de';
import en from '../../../../i18n/locales/en';

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'de';

// Initialize i18n synchronously but handle errors
try {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        de: { translation: de },
        en: { translation: en }
      },
      lng: deviceLanguage,
      fallbackLng: 'de',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });
} catch (error) {
  console.error('Failed to initialize i18n:', error);
  // Fallback to German if initialization fails
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        de: { translation: de }
      },
      lng: 'de',
      fallbackLng: 'de',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });
}

export default i18n;

// Helper function to change language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};
