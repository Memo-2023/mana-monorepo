/**
 * Reactive queries and pure helpers for the Invoices module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalInvoice,
	LocalInvoiceClient,
	Invoice,
	InvoiceClient,
	InvoiceStatus,
	Currency,
} from './types';
import { INVOICE_SETTINGS_ID, CURRENCIES } from './constants';

// ─── Type Converters ─────────────────────────────────────

export function toInvoice(local: LocalInvoice): Invoice {
	const now = new Date().toISOString();
	return {
		id: local.id,
		number: local.number,
		status: local.status,
		clientId: local.clientId ?? null,
		clientSource: local.clientSource,
		clientSnapshot: local.clientSnapshot,
		currency: local.currency,
		issueDate: local.issueDate,
		dueDate: local.dueDate,
		sentAt: local.sentAt ?? null,
		paidAt: local.paidAt ?? null,
		lines: (local.lines ?? []).map((l) => ({
			id: l.id,
			title: l.title,
			description: l.description ?? null,
			quantity: l.quantity,
			unit: l.unit ?? null,
			unitPrice: l.unitPrice,
			vatRate: l.vatRate,
			discount: l.discount ?? null,
		})),
		subject: local.subject ?? null,
		notes: local.notes ?? null,
		terms: local.terms ?? null,
		referenceNumber: local.referenceNumber ?? null,
		pdfBlobKey: local.pdfBlobKey ?? null,
		totals: local.totals,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toInvoiceClient(local: LocalInvoiceClient): InvoiceClient {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		address: local.address ?? null,
		email: local.email ?? null,
		vatNumber: local.vatNumber ?? null,
		iban: local.iban ?? null,
		defaultCurrency: local.defaultCurrency,
		defaultDueDays: local.defaultDueDays,
		notes: local.notes ?? null,
		createdAt: local.createdAt ?? now,
	};
}

// ─── Live Queries ────────────────────────────────────────

/**
 * All invoices (not soft-deleted), decrypted, newest first by issueDate.
 * The `overdue` status is computed on the fly here — we don't persist it
 * because it's a pure function of (status === 'sent') && (dueDate < today)
 * and persisting would require a cron to flip it, creating sync churn.
 */
export function useAllInvoices() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalInvoice, string>('invoices', 'invoices').toArray();
		const visible = locals.filter((i) => !i.deletedAt);
		const decrypted = await decryptRecords('invoices', visible);
		const today = new Date().toISOString().slice(0, 10);
		return decrypted
			.map((local) => {
				const invoice = toInvoice(local);
				if (invoice.status === 'sent' && invoice.dueDate < today) {
					return { ...invoice, status: 'overdue' as InvoiceStatus };
				}
				return invoice;
			})
			.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
	}, [] as Invoice[]);
}

export function useInvoiceClients() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalInvoiceClient, string>(
			'invoices',
			'invoiceClients'
		).toArray();
		const visible = locals.filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords('invoiceClients', visible);
		return decrypted.map(toInvoiceClient).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as InvoiceClient[]);
}

// ─── Pure Helpers ────────────────────────────────────────

export function filterByStatus(invoices: Invoice[], status: InvoiceStatus): Invoice[] {
	return invoices.filter((i) => i.status === status);
}

export function searchInvoices(invoices: Invoice[], query: string): Invoice[] {
	const q = query.toLowerCase();
	return invoices.filter(
		(i) =>
			i.number.toLowerCase().includes(q) ||
			i.clientSnapshot.name.toLowerCase().includes(q) ||
			(i.subject?.toLowerCase().includes(q) ?? false)
	);
}

// ─── Stats ───────────────────────────────────────────────

export interface InvoiceStats {
	totalByStatus: Record<InvoiceStatus, number>;
	/** Open amount = sent + overdue, keyed by currency because we can't sum CHF and EUR. */
	openByCurrency: Record<Currency, number>;
	overdueByCurrency: Record<Currency, number>;
	paidYtdByCurrency: Record<Currency, number>;
	invoicedYtdByCurrency: Record<Currency, number>;
}

function emptyCurrencyMap(): Record<Currency, number> {
	return { CHF: 0, EUR: 0, USD: 0 };
}

export function computeStats(invoices: Invoice[], year: number): InvoiceStats {
	const totalByStatus: Record<InvoiceStatus, number> = {
		draft: 0,
		sent: 0,
		paid: 0,
		overdue: 0,
		void: 0,
	};
	const openByCurrency = emptyCurrencyMap();
	const overdueByCurrency = emptyCurrencyMap();
	const paidYtdByCurrency = emptyCurrencyMap();
	const invoicedYtdByCurrency = emptyCurrencyMap();
	const yearPrefix = String(year);

	for (const inv of invoices) {
		totalByStatus[inv.status]++;
		if (inv.status === 'sent' || inv.status === 'overdue') {
			openByCurrency[inv.currency] += inv.totals.gross;
		}
		if (inv.status === 'overdue') {
			overdueByCurrency[inv.currency] += inv.totals.gross;
		}
		if (inv.issueDate.startsWith(yearPrefix) && inv.status !== 'void' && inv.status !== 'draft') {
			invoicedYtdByCurrency[inv.currency] += inv.totals.gross;
		}
		if (inv.paidAt?.startsWith(yearPrefix)) {
			paidYtdByCurrency[inv.currency] += inv.totals.gross;
		}
	}

	return {
		totalByStatus,
		openByCurrency,
		overdueByCurrency,
		paidYtdByCurrency,
		invoicedYtdByCurrency,
	};
}

// ─── Formatting ──────────────────────────────────────────

/**
 * Format a minor-unit integer amount as a human-readable string with the
 * currency symbol. E.g. (15000, 'CHF') → "CHF 150.00".
 */
export function formatAmount(minor: number, currency: Currency): string {
	const { symbol, minorUnit } = CURRENCIES[currency];
	return `${symbol} ${(minor / minorUnit).toFixed(2)}`;
}

// ─── Settings singleton helpers ──────────────────────────

export { INVOICE_SETTINGS_ID };
