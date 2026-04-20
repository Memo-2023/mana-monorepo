/**
 * Invoices module — barrel exports.
 */

export {
	invoiceTable,
	invoiceClientTable,
	invoiceSettingsTable,
	INVOICES_GUEST_SEED,
} from './collections';

export {
	STATUS_LABELS,
	STATUS_COLORS,
	VAT_RATES_CH,
	VAT_RATES_DE,
	CURRENCIES,
	DEFAULT_DUE_DAYS,
	DEFAULT_NUMBER_PREFIX,
	DEFAULT_NUMBER_PADDING,
	INVOICE_SETTINGS_ID,
} from './constants';

export type {
	LocalInvoice,
	LocalInvoiceLine,
	LocalInvoiceClient,
	LocalInvoiceSettings,
	Invoice,
	InvoiceLine,
	InvoiceClient,
	InvoiceSettings,
	InvoiceStatus,
	InvoiceTotals,
	InvoiceClientSnapshot,
	VatBreakdownEntry,
	Currency,
	ClientSource,
} from './types';
