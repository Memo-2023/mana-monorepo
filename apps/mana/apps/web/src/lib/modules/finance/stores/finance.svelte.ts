/**
 * Finance Store — Mutation-Only Service
 *
 * Phase 5 encryption: transaction `description` and `note` are
 * encrypted at rest. Amount, date, type, categoryId all stay
 * plaintext so chart/aggregation queries continue to work without
 * decryption.
 */

import { transactionTable, categoryTable } from '../collections';
import { toTransaction, toCategory } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import type { LocalTransaction, LocalFinanceCategory, TransactionType } from '../types';

export const financeStore = {
	async addTransaction(data: {
		type: TransactionType;
		amount: number;
		categoryId?: string | null;
		description: string;
		date?: string;
		note?: string;
	}) {
		const newLocal: LocalTransaction = {
			id: crypto.randomUUID(),
			type: data.type,
			amount: Math.abs(data.amount),
			categoryId: data.categoryId ?? null,
			description: data.description,
			date: data.date ?? new Date().toISOString().split('T')[0],
			note: data.note ?? null,
		};

		const plaintextSnapshot = toTransaction(newLocal);
		await encryptRecord('transactions', newLocal);
		await transactionTable.add(newLocal);
		emitDomainEvent('TransactionCreated', 'finance', 'transactions', newLocal.id, {
			transactionId: newLocal.id,
			amount: data.amount,
			type: data.type,
			description: data.description,
		});
		return plaintextSnapshot;
	},

	async updateTransaction(
		id: string,
		data: Partial<
			Pick<LocalTransaction, 'type' | 'amount' | 'categoryId' | 'description' | 'date' | 'note'>
		>
	) {
		const diff: Partial<LocalTransaction> = {
			...data,
		};
		await encryptRecord('transactions', diff);
		await transactionTable.update(id, diff);
	},

	async deleteTransaction(id: string) {
		await transactionTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		emitDomainEvent('TransactionDeleted', 'finance', 'transactions', id, { transactionId: id });
	},

	/**
	 * Upsert an income transaction linked to a paid invoice.
	 *
	 * Deterministic id (`invoice-tx-{invoiceId}`) makes the write idempotent:
	 * marking the same invoice paid twice updates the row instead of
	 * inserting a duplicate. Users can still delete the finance row
	 * manually if they don't want it — this isn't a sealed join.
	 *
	 * Multi-currency caveat: finance stores bare `number` amounts without
	 * a currency column. Callers pass the invoice's gross in its own
	 * currency; if the user mixes CHF invoices and EUR finance, the
	 * finance totals will be wrong — that's a known limitation of the
	 * finance module, not of this bridge.
	 */
	async upsertTransactionFromInvoice(data: {
		invoiceId: string;
		amount: number;
		description: string;
		date: string;
		note?: string;
	}) {
		const id = `invoice-tx-${data.invoiceId}`;
		const newLocal: LocalTransaction = {
			id,
			type: 'income',
			amount: Math.abs(data.amount),
			categoryId: null,
			description: data.description,
			date: data.date,
			note: data.note ?? null,
		};
		await encryptRecord('transactions', newLocal);
		await transactionTable.put(newLocal);
		emitDomainEvent('TransactionCreated', 'finance', 'transactions', id, {
			transactionId: id,
			amount: data.amount,
			type: 'income',
			description: data.description,
			source: 'invoice',
			invoiceId: data.invoiceId,
		});
	},

	/** Remove the auto-generated income when an invoice is reset / voided. */
	async deleteTransactionFromInvoice(invoiceId: string) {
		const id = `invoice-tx-${invoiceId}`;
		const existing = await transactionTable.get(id);
		if (!existing || existing.deletedAt) return;
		await this.deleteTransaction(id);
	},

	async addCategory(data: { name: string; emoji: string; color: string; type: TransactionType }) {
		const existing = await categoryTable.toArray();
		const count = existing.filter((c) => !c.deletedAt && c.type === data.type).length;

		const newLocal: LocalFinanceCategory = {
			id: crypto.randomUUID(),
			name: data.name,
			emoji: data.emoji,
			color: data.color,
			type: data.type,
			order: count,
		};

		await categoryTable.add(newLocal);
		return toCategory(newLocal);
	},

	async deleteCategory(id: string) {
		await categoryTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},
};
