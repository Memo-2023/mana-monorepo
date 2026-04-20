/**
 * Invoices module — Dexie accessors and guest seed.
 *
 * Tables:
 *   - `invoices`          — the invoice records themselves
 *   - `invoiceClients`    — optional per-user client book
 *   - `invoiceSettings`   — singleton sender profile + number sequence
 */

import { db } from '$lib/data/database';
import type { LocalInvoice, LocalInvoiceClient, LocalInvoiceSettings } from './types';

export const invoiceTable = db.table<LocalInvoice>('invoices');
export const invoiceClientTable = db.table<LocalInvoiceClient>('invoiceClients');
export const invoiceSettingsTable = db.table<LocalInvoiceSettings>('invoiceSettings');

// ─── Guest Seed ────────────────────────────────────────────
// One draft invoice so first-run users immediately see what the module is
// for. Amounts stored in Rappen / cents (integer) — 150.00 CHF → 15000.

export const INVOICES_GUEST_SEED = {
	invoices: [
		{
			id: 'demo-invoice-draft',
			number: `${new Date().getFullYear()}-0001`,
			status: 'draft' as const,
			clientId: null,
			clientSource: 'invoice-client' as const,
			clientSnapshot: {
				name: 'Muster Kunde AG',
				address: 'Bahnhofstrasse 1\n8000 Zürich',
				email: 'kontakt@muster-kunde.ch',
			},
			currency: 'CHF' as const,
			issueDate: new Date().toISOString().slice(0, 10),
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
			sentAt: null,
			paidAt: null,
			lines: [
				{
					id: 'demo-line-1',
					title: 'Beratung',
					description: null,
					quantity: 4,
					unit: 'Std',
					unitPrice: 15000, // 150.00 CHF
					vatRate: 8.1,
					discount: null,
				},
			],
			subject: 'Beratungsleistung',
			notes: null,
			terms: 'Zahlbar innert 30 Tagen netto.',
			referenceNumber: null,
			pdfBlobKey: null,
			totals: {
				net: 60000,
				vat: 4860,
				gross: 64860,
				vatBreakdown: [{ rate: 8.1, base: 60000, tax: 4860 }],
			},
		},
	],
};
