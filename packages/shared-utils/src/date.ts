/**
 * Date utility functions
 */

import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

const locales = {
	de,
	en: enUS,
};

export type LocaleKey = keyof typeof locales;

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

/**
 * Format timestamp with relative day labels (Today, Yesterday, or full date)
 *
 * Examples:
 * - Today → "Today, 14:30" / "Heute, 14:30"
 * - Yesterday → "Yesterday, 14:30" / "Gestern, 14:30"
 * - Other → "15. März 2024, 14:30" / "March 15, 2024, 2:30 PM"
 */
export function formatTimestamp(date: string | Date, locale: LocaleKey = 'de'): string {
	const dateObj = typeof date === 'string' ? parseISO(date) : date;
	const timeFormat = locale === 'de' ? 'HH:mm' : 'h:mm a';

	const labels = {
		de: { today: 'Heute', yesterday: 'Gestern' },
		en: { today: 'Today', yesterday: 'Yesterday' },
	};

	if (isToday(dateObj)) {
		return `${labels[locale].today}, ${format(dateObj, timeFormat)}`;
	}

	if (isYesterday(dateObj)) {
		return `${labels[locale].yesterday}, ${format(dateObj, timeFormat)}`;
	}

	const dateFormat = locale === 'de' ? 'd. MMMM yyyy' : 'MMMM d, yyyy';
	return `${format(dateObj, dateFormat, { locale: locales[locale] })}, ${format(dateObj, timeFormat)}`;
}

/**
 * Check if a date is today
 */
export { isToday, isYesterday } from 'date-fns';

/**
 * Format timestamp as short date
 *
 * @param date - Date to format
 * @param locale - Locale for formatting ('de' or 'en')
 * @returns Formatted short date string (e.g., "15 Mar 2024" or "15. Mär. 2024")
 */
export function formatShortDate(date: Date | string, locale: LocaleKey = 'de'): string {
	const dateObj = typeof date === 'string' ? parseISO(date) : date;

	return format(dateObj, 'dd MMM yyyy', { locale: locales[locale] });
}
