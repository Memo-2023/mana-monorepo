/**
 * i18n utility functions
 */

import { type LanguageCode, isLanguageSupported } from './languages';

/**
 * Detect user's preferred locale from browser
 * Works in browser environment only
 */
export function detectBrowserLocale(
  supportedLocales: readonly string[],
  defaultLocale: string = 'en'
): string {
  if (typeof navigator === 'undefined') {
    return defaultLocale;
  }

  // Try navigator.language first
  const browserLang = navigator.language;

  // Check exact match (e.g., 'pt-BR')
  if (supportedLocales.includes(browserLang)) {
    return browserLang;
  }

  // Check base language (e.g., 'pt' from 'pt-BR')
  const baseLang = browserLang.split('-')[0];
  if (supportedLocales.includes(baseLang)) {
    return baseLang;
  }

  // Try navigator.languages array
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      if (supportedLocales.includes(lang)) {
        return lang;
      }
      const base = lang.split('-')[0];
      if (supportedLocales.includes(base)) {
        return base;
      }
    }
  }

  return defaultLocale;
}

/**
 * Get locale from localStorage with validation
 */
export function getStoredLocale(
  storageKey: string,
  supportedLocales: readonly string[]
): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(storageKey);
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }

  return null;
}

/**
 * Store locale in localStorage
 */
export function storeLocale(storageKey: string, locale: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(storageKey, locale);
}

/**
 * Get initial locale with priority:
 * 1. localStorage
 * 2. Browser language
 * 3. Default locale
 */
export function getInitialLocale(
  storageKey: string,
  supportedLocales: readonly string[],
  defaultLocale: string = 'en'
): string {
  // Check localStorage first
  const stored = getStoredLocale(storageKey, supportedLocales);
  if (stored) {
    return stored;
  }

  // Fall back to browser language
  return detectBrowserLocale(supportedLocales, defaultLocale);
}

/**
 * Normalize locale code to standard format
 * Examples: 'en-us' -> 'en-US', 'pt_BR' -> 'pt-BR'
 */
export function normalizeLocale(locale: string): string {
  const parts = locale.replace('_', '-').split('-');

  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }

  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

/**
 * Get base language from locale code
 * Examples: 'pt-BR' -> 'pt', 'en-US' -> 'en'
 */
export function getBaseLanguage(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}

/**
 * Check if locale matches a language (including variants)
 * Examples: matchesLanguage('pt-BR', 'pt') -> true
 */
export function matchesLanguage(locale: string, language: string): boolean {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedLanguage = language.toLowerCase();

  return (
    normalizedLocale === normalizedLanguage ||
    getBaseLanguage(normalizedLocale) === normalizedLanguage
  );
}

/**
 * Find best matching locale from supported list
 */
export function findBestMatch(
  preferredLocale: string,
  supportedLocales: readonly string[],
  defaultLocale: string = 'en'
): string {
  const normalized = normalizeLocale(preferredLocale);

  // Exact match
  if (supportedLocales.includes(normalized)) {
    return normalized;
  }

  // Base language match
  const base = getBaseLanguage(normalized);
  if (supportedLocales.includes(base)) {
    return base;
  }

  // Find any variant of the same language
  const variant = supportedLocales.find(loc => getBaseLanguage(loc) === base);
  if (variant) {
    return variant;
  }

  return defaultLocale;
}

/**
 * Format number according to locale
 */
export function formatLocalizedNumber(
  value: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format date according to locale
 */
export function formatLocalizedDate(
  date: Date | string | number,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format relative time according to locale
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en',
  style: 'long' | 'short' | 'narrow' = 'long'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, 'week');
  } else if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  } else {
    return rtf.format(diffYears, 'year');
  }
}

/**
 * Get plural form category
 */
export function getPluralCategory(
  count: number,
  locale: string = 'en'
): Intl.LDMLPluralRule {
  const pr = new Intl.PluralRules(locale);
  return pr.select(count);
}

/**
 * Interpolate values into a translation string
 * Example: interpolate("Hello {name}!", { name: "World" }) -> "Hello World!"
 */
export function interpolate(
  text: string,
  values: Record<string, string | number>
): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return key in values ? String(values[key]) : match;
  });
}
