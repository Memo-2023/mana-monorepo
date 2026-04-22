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

export {
	useAllInvoices,
	useInvoiceClients,
	toInvoice,
	toInvoiceClient,
	filterByStatus,
	searchInvoices,
	computeStats,
	formatAmount,
} from './queries';

export { computeLineTotal, computeInvoiceTotals, EMPTY_TOTALS } from './totals';

// Deliberately NOT re-exporting the PDF renderer from here: it pulls
// pdf-lib + swissqrbill/svg (~350 KB) and would force every consumer of
// the module's barrel into a fat bundle. Use `await import(
// '$lib/modules/invoices/pdf/renderer')` at the call site instead.
export { generateSCORReference } from './pdf/scor';
export { QRBillError } from './pdf/qr-bill';

export { invoicesStore } from './stores/invoices.svelte';
export { invoiceSettingsStore, ensureSettings } from './stores/settings.svelte';

export { invoicesTools } from './tools';

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

export type { InvoiceStats } from './queries';
export type { CreateInvoiceInput } from './stores/invoices.svelte';
