/**
 * Shared i18n for Manacore monorepo
 *
 * This package provides common i18n utilities, language definitions,
 * and translations that can be shared across all projects.
 */

// Language definitions
export {
  type LanguageCode,
  type LanguageInfo,
  LANGUAGES,
  getLanguageCodes,
  getLanguageInfo,
  isLanguageSupported,
  isRTL,
  getLanguageDisplayName,
  LOCALE_GROUPS,
  getLanguagesByGroup,
} from './languages';

// Utilities
export {
  detectBrowserLocale,
  getStoredLocale,
  storeLocale,
  getInitialLocale,
  normalizeLocale,
  getBaseLanguage,
  matchesLanguage,
  findBestMatch,
  formatLocalizedNumber,
  formatLocalizedDate,
  formatRelativeTime,
  getPluralCategory,
  interpolate,
} from './utils';

// Common translations
export {
  en as commonTranslationsEn,
  de as commonTranslationsDe,
  type CommonTranslations,
  getCommonTranslations,
  mergeWithCommon,
} from './translations/common';

// Auth translations
export {
  en as authTranslationsEn,
  de as authTranslationsDe,
  it as authTranslationsIt,
  fr as authTranslationsFr,
  es as authTranslationsEs,
  type AuthTranslations,
  type AuthLocale,
  authTranslations,
  getAuthTranslations,
  getLoginTranslations,
  getRegisterTranslations,
  getForgotPasswordTranslations,
} from './translations/auth';

// Components
export { LanguageSelector } from './components';
