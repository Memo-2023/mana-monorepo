import type { Currency, InvoiceStatus } from './types';

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

/** Swiss VAT rates as of 2024 (MwSt-Satz). */
export const VAT_RATES_CH = [
	{ value: 0, label: '0% (ausgenommen)' },
	{ value: 2.6, label: '2.6% (reduziert)' },
	{ value: 3.8, label: '3.8% (Beherbergung)' },
	{ value: 8.1, label: '8.1% (Normalsatz)' },
];

/** German VAT rates. */
export const VAT_RATES_DE = [
	{ value: 0, label: '0%' },
	{ value: 7, label: '7% (ermäßigt)' },
	{ value: 19, label: '19% (Regelsatz)' },
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
