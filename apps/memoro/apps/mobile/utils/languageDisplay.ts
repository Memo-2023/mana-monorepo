import { TFunction } from 'react-i18next';

/**
 * Formats language name for display showing frontend language name first, followed by native name
 * @param languageCode - The language code (e.g., 'de', 'en', 'fr')
 * @param nativeName - The native name of the language (e.g., 'Deutsch', 'English', 'Français')
 * @param t - Translation function from useTranslation hook
 * @returns Formatted language string (e.g., "German (Deutsch)" when interface is English)
 */
export function formatLanguageDisplay(
  languageCode: string,
  nativeName: string,
  t: TFunction
): string {
  // Get the translated language name in the current frontend language
  const translatedName = t(`language.languages.${languageCode}`, nativeName);
  
  // If the translated name is the same as native name, just return the native name
  if (translatedName === nativeName) {
    return nativeName;
  }
  
  // Return format: "TranslatedName (NativeName)"
  return `${translatedName} (${nativeName})`;
}