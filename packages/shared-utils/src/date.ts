/**
 * Date utility functions
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

const locales = {
  de,
  en: enUS,
};

type LocaleKey = keyof typeof locales;

/**
 * Format a date string to a readable format
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'PPP',
  locale: LocaleKey = 'de'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: locales[locale] });
}

/**
 * Get relative time from now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date, locale: LocaleKey = 'de'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: locales[locale],
  });
}

/**
 * Format a date for API requests (ISO string)
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
