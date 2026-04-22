/**
 * Invoices store — mutation-only service.
 *
 * Reads happen via queries.ts. Writes go through this store so the
 * encryption step, totals recomputation, and event emission stay
 * consistent. The status machine is enforced here:
 *
 *   draft  → sent (markSent)  → paid (markPaid)
 *                             → void (voidInvoice)
 *   any    → void (voidInvoice)
 *
 * "overdue" is NOT a persisted status — it's derived on read from
 * (status==='sent' && dueDate < today). See queries.ts.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { invoiceTable } from '../collections';
import { computeInvoiceTotals } from '../totals';
import { generateSCORReference } from '../pdf/scor';
import { financeStore } from '$lib/modules/finance/stores/finance.svelte';
import { CURRENCIES } from '../constants';
import type {
	LocalInvoice,
	LocalInvoiceLine,
	InvoiceClientSnapshot,
	ClientSource,
	Currency,
} from '../types';
import { invoiceSettingsStore } from './settings.svelte';

export interface CreateInvoiceInput {
	clientId: string | null;
	clientSource: ClientSource;
	clientSnapshot: InvoiceClientSnapshot;
	currency: Currency;
	issueDate?: string;
	dueDate?: string;
	lines?: LocalInvoiceLine[];
	subject?: string | null;
	notes?: string | null;
	terms?: string | null;
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDaysISO(base: string, days: number): string {
	const d = new Date(`${base}T00:00:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

export const invoicesStore = {
	/**
	 * Create a new invoice in status `draft`. Pulls the next invoice number
	 * atomically from settings, falls back to sensible defaults for dates /
	 * terms / VAT if the caller didn't set them.
	 */
	async createInvoice(input: CreateInvoiceInput): Promise<string> {
		const defaults = await invoiceSettingsStore.getDefaults();
		const number = await invoiceSettingsStore.takeNextNumber();
		const issueDate = input.issueDate ?? todayISO();
		const dueDate = input.dueDate ?? addDaysISO(issueDate, defaults.dueDays);
		const lines = input.lines ?? [];
		const totals = computeInvoiceTotals(lines);

		// Pre-compute the SCOR reference so it's stable across re-renders of
		// the PDF — the number is derived from invoice.number, which is
		// already locked in at this point. Only used for CHF/EUR QR-Bills;
		// other currencies ignore it.
		const referenceNumber = generateSCORReference(number);

		const newLocal: LocalInvoice = {
			id: crypto.randomUUID(),
			number,
			status: 'draft',
			clientId: input.clientId,
			clientSource: input.clientSource,
			clientSnapshot: input.clientSnapshot,
			currency: input.currency,
			issueDate,
			dueDate,
			sentAt: null,
			paidAt: null,
			lines,
			subject: input.subject ?? null,
			notes: input.notes ?? null,
			terms: input.terms ?? defaults.terms,
			referenceNumber,
			pdfBlobKey: null,
			totals,
		};

		await encryptRecord('invoices', newLocal);
		await invoiceTable.add(newLocal);
		emitDomainEvent('InvoiceCreated', 'invoices', 'invoices', newLocal.id, {
			invoiceId: newLocal.id,
			number,
			gross: totals.gross,
			currency: input.currency,
		});
		return newLocal.id;
	},

	/**
	 * Update free-form metadata on a draft invoice. Only drafts are editable —
	 * once an invoice is sent, its content is frozen (see plan §Offene Fragen).
	 * To "fix" a sent invoice, void it and duplicate → edit → send again.
	 */
	async updateInvoice(
		id: string,
		patch: Partial<
			Pick<
				LocalInvoice,
				| 'clientId'
				| 'clientSource'
				| 'clientSnapshot'
				| 'currency'
				| 'issueDate'
				| 'dueDate'
				| 'subject'
				| 'notes'
				| 'terms'
				| 'referenceNumber'
				| 'number'
			>
		>
	) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') {
			throw new Error(
				'[invoices] only drafts can be edited; void and duplicate to revise a sent invoice'
			);
		}
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('invoices', wrapped);
		await invoiceTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Replace the full line list. Recomputes totals so denormalised totals
	 * stay in sync with the lines (invariant the dashboard queries depend on).
	 * Drafts only — see updateInvoice.
	 */
	async updateLines(id: string, lines: LocalInvoiceLine[]) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') {
			throw new Error('[invoices] only drafts can be edited');
		}
		const totals = computeInvoiceTotals(lines);
		const patch = { lines, totals } as Record<string, unknown>;
		// `lines` is in the encryption allowlist; `totals` is not. encryptRecord
		// only touches allowlisted keys, so a single call is correct for both.
		await encryptRecord('invoices', patch);
		await invoiceTable.update(id, {
			...patch,
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Transition draft → sent. Freezes the invoice (no more edits) and stamps
	 * sentAt. The caller is expected to have already triggered the send flow
	 * (e.g. open mail compose with PDF attached); this is purely the state
	 * transition.
	 */
	async markSent(id: string) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') return;
		await invoiceTable.update(id, {
			status: 'sent',
			sentAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('InvoiceSent', 'invoices', 'invoices', id, {
			invoiceId: id,
			number: existing.number,
		});
	},

	/**
	 * Transition sent/overdue → paid. `paidAt` defaults to today; caller can
	 * override for back-dated entries (e.g. "customer paid last Friday").
	 */
	async markPaid(id: string, paidAt?: string) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status !== 'sent' && existing.status !== 'overdue') return;
		const stamp = paidAt ?? new Date().toISOString();
		await invoiceTable.update(id, {
			status: 'paid',
			paidAt: stamp,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('InvoicePaid', 'invoices', 'invoices', id, {
			invoiceId: id,
			number: existing.number,
			paidAt: stamp,
		});

		// Cross-module: upsert a finance income transaction so paid invoices
		// show up in the user's Finance-Übersicht without a separate manual
		// entry. Best-effort — if the finance-side encryption isn't ready
		// (first-boot race), we log and move on; the invoice write already
		// succeeded and sync will propagate.
		try {
			const { decryptRecords } = await import('$lib/data/crypto');
			const [decrypted] = (await decryptRecords('invoices', [existing])) as LocalInvoice[];
			const currency = (decrypted.currency ?? existing.currency) as Currency;
			const minor = CURRENCIES[currency]?.minorUnit ?? 100;
			const amount = (decrypted.totals?.gross ?? existing.totals.gross) / minor;
			await financeStore.upsertTransactionFromInvoice({
				invoiceId: id,
				amount,
				description: `Rechnung ${existing.number} — ${decrypted.clientSnapshot?.name ?? '—'}`,
				date: stamp.slice(0, 10),
				note: `Auto-Eintrag aus Rechnung ${existing.number} (${currency})`,
			});
		} catch (e) {
			console.warn('[invoices] finance cross-link failed, transaction not created:', e);
		}
	},

	/**
	 * Void an invoice — works from any non-paid status. Preserves the row
	 * (sequence-number history matters for bookkeeping) but flags it
	 * inactive. Paid invoices can't be voided; issue a credit note instead
	 * (Phase 2 feature).
	 */
	async voidInvoice(id: string) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status === 'paid') {
			throw new Error('[invoices] paid invoices cannot be voided; issue a credit note');
		}
		await invoiceTable.update(id, {
			status: 'void',
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('InvoiceVoided', 'invoices', 'invoices', id, {
			invoiceId: id,
			number: existing.number,
		});
		// Voiding doesn't touch the finance side because voiding a paid
		// invoice isn't allowed (credit-note path, Phase 2); and unpaid
		// invoices never created a finance row to begin with. Guard is
		// here so a future unfreeze of the paid→void edge doesn't
		// silently leave the finance row dangling.
		if (existing.status === 'sent' || existing.status === 'overdue') {
			// No-op — there's no finance row yet.
		}
	},

	/**
	 * Duplicate an existing invoice (typically a sent/paid one that needs
	 * reissuing). Produces a new draft with a fresh number, today's issue
	 * date, and the same lines / client / subject.
	 */
	async duplicate(id: string): Promise<string> {
		const existing = await invoiceTable.get(id);
		if (!existing) throw new Error('[invoices] duplicate: source not found');
		const { decryptRecords } = await import('$lib/data/crypto');
		const [decrypted] = (await decryptRecords('invoices', [existing])) as LocalInvoice[];
		return this.createInvoice({
			clientId: decrypted.clientId,
			clientSource: decrypted.clientSource,
			clientSnapshot: decrypted.clientSnapshot,
			currency: decrypted.currency,
			lines: decrypted.lines,
			subject: decrypted.subject,
			notes: decrypted.notes,
			terms: decrypted.terms,
		});
	},

	/**
	 * Soft-delete — sets deletedAt. Only drafts and voided invoices can be
	 * deleted; sent/paid/overdue must be voided first (bookkeeping: you don't
	 * make evidence of a sent invoice disappear).
	 */
	async deleteInvoice(id: string) {
		const existing = await invoiceTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft' && existing.status !== 'void') {
			throw new Error('[invoices] only drafts or voided invoices can be deleted');
		}
		await invoiceTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('InvoiceDeleted', 'invoices', 'invoices', id, { invoiceId: id });
	},
};
