/**
 * Invoices module types.
 *
 * Outbound finance: the user issues invoices to their clients. Plan:
 * `docs/plans/invoices-module.md`. Sibling to `finance` (inbound tracking),
 * not a replacement.
 *
 * Money is stored as integers in the currency's smallest unit (Rappen / cents)
 * to avoid floating-point drift on totals. Conversion to display format
 * happens in the view layer.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Discriminators & Enums ──────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export type Currency = 'CHF' | 'EUR' | 'USD';

/**
 * Which table the `clientId` FK points into. Set at create time so the
 * resolver can look up the snapshot without having to probe both tables.
 */
export type ClientSource = 'contact' | 'invoice-client';

// ─── Line Items ──────────────────────────────────────────

/**
 * A single invoice line. `id` is a client-generated UUID used as the stable
 * key for reorder operations — not a Dexie row id (lines live inline on the
 * invoice for atomicity of edits and serialisation through the encryption
 * boundary).
 */
export interface LocalInvoiceLine {
	id: string;
	title: string;
	description?: string | null;
	quantity: number;
	unit?: string | null;
	/** In the currency's smallest unit (Rappen / cents), integer. */
	unitPrice: number;
	/** Percent; e.g. 8.1 for Swiss standard rate. */
	vatRate: number;
	/** Percent; 0..100. null/undefined means no discount. */
	discount?: number | null;
}

// ─── Totals ──────────────────────────────────────────────

export interface VatBreakdownEntry {
	rate: number;
	base: number;
	tax: number;
}

/**
 * Denormalised totals — recomputed on every update. Kept plaintext so the
 * dashboard widgets / overdue-sum queries don't have to decrypt.
 */
export interface InvoiceTotals {
	net: number;
	vat: number;
	gross: number;
	vatBreakdown: VatBreakdownEntry[];
}

// ─── Client Snapshot ─────────────────────────────────────

/**
 * Frozen at send time so that later edits to the Contact / InvoiceClient
 * don't retroactively change a legally binding, already-sent invoice.
 * See §"Offene Fragen" in the plan for the edit-after-send policy (only
 * drafts are editable for this reason).
 */
export interface InvoiceClientSnapshot {
	name: string;
	/**
	 * Legacy free-text multi-line address. Kept for backward compatibility
	 * with invoices created before the structured-address migration and for
	 * users who don't want to fill in five fields for a one-off client.
	 * When structured fields are set, they take precedence for the QR-Bill.
	 */
	address?: string;
	/** Structured address — preferred source for QR-Bill rendering. */
	street?: string;
	zip?: string;
	city?: string;
	country?: string;
	email?: string;
	vatNumber?: string;
}

// ─── Local Record — Invoice (Dexie) ──────────────────────

export interface LocalInvoice extends BaseRecord {
	/** Rendered invoice number, e.g. "2026-0042". Generated from settings. */
	number: string;
	status: InvoiceStatus;
	clientId: string | null;
	clientSource: ClientSource;
	clientSnapshot: InvoiceClientSnapshot;
	currency: Currency;
	/** YYYY-MM-DD */
	issueDate: string;
	/** YYYY-MM-DD */
	dueDate: string;
	/** ISO timestamp — filled when status transitions to sent. */
	sentAt?: string | null;
	/** ISO timestamp — filled when status transitions to paid. */
	paidAt?: string | null;
	lines: LocalInvoiceLine[];
	subject?: string | null;
	notes?: string | null;
	terms?: string | null;
	/** QR-Referenz (CH: 27 digits, mod-10 check) or SCOR ISO 11649. */
	referenceNumber?: string | null;
	/** uload media id of the most recently rendered PDF (cache). */
	pdfBlobKey?: string | null;
	totals: InvoiceTotals;
}

// ─── Local Record — Client Book (Dexie) ──────────────────

/**
 * Optional separate client book for invoice-specific data that doesn't
 * belong in the main contacts table (IBAN for SEPA, default due days,
 * default currency). Users can also just invoice contacts directly —
 * this table is opt-in.
 */
export interface LocalInvoiceClient extends BaseRecord {
	name: string;
	address?: string | null;
	email?: string | null;
	vatNumber?: string | null;
	iban?: string | null;
	defaultCurrency: Currency;
	defaultDueDays: number;
	notes?: string | null;
}

// ─── Local Record — Settings (Dexie, singleton per user) ─

/**
 * User-scoped sender profile + number sequence state. There is exactly one
 * row per user; `id` is a stable sentinel (`'invoice-settings'`) and the
 * Dexie hook stamps userId as usual.
 */
export interface LocalInvoiceSettings extends BaseRecord {
	// Sender profile — structured fields are preferred for QR-Bill;
	// senderAddress (legacy free-text) remains a fallback so existing
	// settings don't break until the user opens the form and fills in
	// the split fields.
	senderName: string;
	senderAddress: string;
	senderStreet?: string | null;
	senderZip?: string | null;
	senderCity?: string | null;
	senderCountry?: string | null;
	senderEmail: string;
	senderVatNumber?: string | null;
	senderIban: string;
	senderBic?: string | null;

	// Branding
	logoMediaId?: string | null;
	accentColor: string;
	footer?: string | null;

	// Number sequence
	numberPrefix: string;
	numberPadding: number;
	nextNumber: number;

	// Defaults
	defaultCurrency: Currency;
	defaultVatRate: number;
	defaultDueDays: number;
	defaultTerms?: string | null;
}

// ─── Domain Types (plaintext, for UI) ────────────────────

export interface InvoiceLine {
	id: string;
	title: string;
	description: string | null;
	quantity: number;
	unit: string | null;
	unitPrice: number;
	vatRate: number;
	discount: number | null;
}

export interface Invoice {
	id: string;
	number: string;
	status: InvoiceStatus;
	clientId: string | null;
	clientSource: ClientSource;
	clientSnapshot: InvoiceClientSnapshot;
	currency: Currency;
	issueDate: string;
	dueDate: string;
	sentAt: string | null;
	paidAt: string | null;
	lines: InvoiceLine[];
	subject: string | null;
	notes: string | null;
	terms: string | null;
	referenceNumber: string | null;
	pdfBlobKey: string | null;
	totals: InvoiceTotals;
	createdAt: string;
	updatedAt: string;
}

export interface InvoiceClient {
	id: string;
	name: string;
	address: string | null;
	email: string | null;
	vatNumber: string | null;
	iban: string | null;
	defaultCurrency: Currency;
	defaultDueDays: number;
	notes: string | null;
	createdAt: string;
}

export interface InvoiceSettings {
	id: string;
	senderName: string;
	senderAddress: string;
	senderStreet: string | null;
	senderZip: string | null;
	senderCity: string | null;
	senderCountry: string | null;
	senderEmail: string;
	senderVatNumber: string | null;
	senderIban: string;
	senderBic: string | null;
	logoMediaId: string | null;
	accentColor: string;
	footer: string | null;
	numberPrefix: string;
	numberPadding: number;
	nextNumber: number;
	defaultCurrency: Currency;
	defaultVatRate: number;
	defaultDueDays: number;
	defaultTerms: string | null;
}
