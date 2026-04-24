/**
 * Locale-aware formatters that read the active locale from svelte-i18n.
 *
 * Use these instead of a hard-coded "de-DE" passed to
 * toLocaleDateString / toLocaleString / Intl.NumberFormat. Hard-coded
 * locales pin the output to German even when the UI is switched.
 *
 * Callable from both .svelte and .ts files. Inside a Svelte component,
 * include `$locale` as a dep in a `$derived` block if you need the
 * output to update when the user switches languages mid-session.
 */

import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';
import type { Locale as DateFnsLocale } from 'date-fns';
import { de, enUS, it, fr, es } from 'date-fns/locale';

type DateInput = Date | string | number;

const DATE_FNS_LOCALES: Record<string, DateFnsLocale> = {
	de,
	en: enUS,
	it,
	fr,
	es,
};

/** Active locale string, e.g. 'de' or 'en'. Falls back to 'de'. */
export function getCurrentLocale(): string {
	return get(locale) ?? 'de';
}

/**
 * BCP-47 tag for Intl APIs. svelte-i18n stores a bare `de`; Intl
 * prefers `de-DE`-style tags for predictable formatting. Mapping is
 * best-effort — Intl itself is lenient.
 */
function toBcp47(loc: string): string {
	switch (loc) {
		case 'de':
			return 'de-DE';
		case 'en':
			return 'en-US';
		case 'it':
			return 'it-IT';
		case 'fr':
			return 'fr-FR';
		case 'es':
			return 'es-ES';
		default:
			return loc;
	}
}

function toDate(value: DateInput): Date {
	return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
	return toDate(value).toLocaleDateString(toBcp47(getCurrentLocale()), options);
}

export function formatTime(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
	return toDate(value).toLocaleTimeString(toBcp47(getCurrentLocale()), options);
}

export function formatDateTime(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
	return toDate(value).toLocaleString(toBcp47(getCurrentLocale()), options);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
	return value.toLocaleString(toBcp47(getCurrentLocale()), options);
}

export function formatCurrency(
	value: number,
	currency = 'EUR',
	options?: Intl.NumberFormatOptions
): string {
	return value.toLocaleString(toBcp47(getCurrentLocale()), {
		style: 'currency',
		currency,
		...options,
	});
}

/** date-fns locale object for the active locale. Defaults to `de`. */
export function getDateFnsLocale(): DateFnsLocale {
	return DATE_FNS_LOCALES[getCurrentLocale()] ?? de;
}
