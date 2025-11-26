import { AZURE_SUPPORTED_LANGUAGES } from '~/features/audioRecordingV2';

/**
 * Maps language codes to readable language names
 * @param languageCode - The language code (e.g., "de-DE", "en-US", "de")
 * @returns The readable language name (e.g., "Deutsch", "English")
 */
export function getLanguageDisplayName(languageCode: string): string {
  if (!languageCode || languageCode === 'unknown') {
    return 'unknown';
  }
  
  // Check for exact match first (e.g., "de-DE")
  const exactMatch = Object.entries(AZURE_SUPPORTED_LANGUAGES).find(
    ([_, value]) => value.locale === languageCode
  );
  if (exactMatch) {
    return exactMatch[1].nativeName;
  }
  
  // Check for partial match (e.g., "de" matches "de-DE")
  const partialMatch = Object.entries(AZURE_SUPPORTED_LANGUAGES).find(
    ([key, value]) => languageCode.startsWith(key) || value.locale.startsWith(languageCode)
  );
  if (partialMatch) {
    return partialMatch[1].nativeName;
  }
  
  // Fallback: return the language code as-is
  return languageCode;
}

/**
 * Maps language codes to readable language names with emoji
 * @param languageCode - The language code (e.g., "de-DE", "en-US", "de")
 * @returns The readable language name with emoji (e.g., "🇩🇪 Deutsch", "🇺🇸 English")
 */
export function getLanguageDisplayNameWithEmoji(languageCode: string): string {
  if (!languageCode || languageCode === 'unknown') {
    return 'unknown';
  }
  
  // Check for exact match first (e.g., "de-DE")
  const exactMatch = Object.entries(AZURE_SUPPORTED_LANGUAGES).find(
    ([_, value]) => value.locale === languageCode
  );
  if (exactMatch) {
    return `${exactMatch[1].emoji} ${exactMatch[1].nativeName}`;
  }
  
  // Check for partial match (e.g., "de" matches "de-DE")
  const partialMatch = Object.entries(AZURE_SUPPORTED_LANGUAGES).find(
    ([key, value]) => languageCode.startsWith(key) || value.locale.startsWith(languageCode)
  );
  if (partialMatch) {
    return `${partialMatch[1].emoji} ${partialMatch[1].nativeName}`;
  }
  
  // Fallback: return the language code as-is
  return languageCode;
}