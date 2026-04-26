import type { Currency, InvoiceStatus } from './types';

/**
 * Status display labels are now sourced from the `invoices.status.*` i18n
 * namespace. Components should call `$_('invoices.status.' + status)`
 * directly. The legacy STATUS_LABELS export is kept for non-Svelte callers
 * (mail-template, PDF renderer) that don't have access to the i18n store.
 */
export const STATUS_LABELS: Record<InvoiceStatus, { de: string; en: string }> = {
	draft: { de: 'Entwurf', en: 'Draft' },
	sent: { de: 'Versendet', en: 'Sent' },
	paid: { de: 'Bezahlt', en: 'Paid' },
	overdue: { de: 'Überfällig', en: 'Overdue' },
	void: { de: 'Storniert', en: 'Void' },
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
	draft: '#64748b',
	sent: '#3b82f6',
	paid: '#22c55e',
	overdue: '#ef4444',
	void: '#94a3b8',
};

/**
 * VAT rate option lists carry i18n keys (under `invoices.vat_ch.*` /
 * `invoices.vat_de.*`) instead of literal labels. Consumers resolve to
 * the active locale via `$_(option.i18nKey)`.
 */
export const VAT_RATES_CH = [
	{ value: 0, i18nKey: 'invoices.vat_ch.v0' },
	{ value: 2.6, i18nKey: 'invoices.vat_ch.v2_6' },
	{ value: 3.8, i18nKey: 'invoices.vat_ch.v3_8' },
	{ value: 8.1, i18nKey: 'invoices.vat_ch.v8_1' },
];

export const VAT_RATES_DE = [
	{ value: 0, i18nKey: 'invoices.vat_de.v0' },
	{ value: 7, i18nKey: 'invoices.vat_de.v7' },
	{ value: 19, i18nKey: 'invoices.vat_de.v19' },
];

export const CURRENCIES: Record<Currency, { symbol: string; minorUnit: number }> = {
	CHF: { symbol: 'CHF', minorUnit: 100 },
	EUR: { symbol: '€', minorUnit: 100 },
	USD: { symbol: '$', minorUnit: 100 },
};

export const DEFAULT_DUE_DAYS = 30;

export const DEFAULT_NUMBER_PREFIX = `${new Date().getFullYear()}-`;
export const DEFAULT_NUMBER_PADDING = 4;

/** Sentinel id for the singleton settings row. Stable across devices so the
 *  sync engine dedupes on it instead of fighting over two parallel rows. */
export const INVOICE_SETTINGS_ID = 'invoice-settings';
