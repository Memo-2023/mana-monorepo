/**
 * Reactive Queries & Pure Helpers for Finance module.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalTransaction,
	LocalFinanceCategory,
	Transaction,
	FinanceCategory,
	TransactionType,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toTransaction(local: LocalTransaction): Transaction {
	return {
		id: local.id,
		type: local.type,
		amount: local.amount,
		categoryId: local.categoryId,
		description: local.description,
		date: local.date,
		note: local.note,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toCategory(local: LocalFinanceCategory): FinanceCategory {
	return {
		id: local.id,
		name: local.name,
		emoji: local.emoji,
		color: local.color,
		type: local.type,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllTransactions() {
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalTransaction, string>('finance', 'transactions').toArray()
		).filter((t) => !t.deletedAt);
		const decrypted = await decryptRecords('transactions', visible);
		return decrypted
			.map(toTransaction)
			.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
	}, [] as Transaction[]);
}

export function useAllCategories() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalFinanceCategory, string>(
			'finance',
			'financeCategories'
		).toArray();
		return locals
			.filter((c) => !c.deletedAt)
			.map(toCategory)
			.sort((a, b) => a.order - b.order);
	}, [] as FinanceCategory[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Current month string YYYY-MM */
export function currentMonth(): string {
	return new Date().toISOString().slice(0, 7);
}

/** Today string YYYY-MM-DD */
export function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Filter transactions for a month (YYYY-MM) */
export function getTransactionsForMonth(txs: Transaction[], month: string): Transaction[] {
	return txs.filter((t) => t.date.startsWith(month));
}

/** Get total for a type in a month */
export function getMonthTotal(txs: Transaction[], month: string, type: TransactionType): number {
	return getTransactionsForMonth(txs, month)
		.filter((t) => t.type === type)
		.reduce((sum, t) => sum + t.amount, 0);
}

/** Get balance (income - expenses) for a month */
export function getMonthBalance(txs: Transaction[], month: string): number {
	const income = getMonthTotal(txs, month, 'income');
	const expenses = getMonthTotal(txs, month, 'expense');
	return income - expenses;
}

/** Group transactions by date */
export function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
	const groups = new Map<string, Transaction[]>();
	for (const tx of txs) {
		const existing = groups.get(tx.date) || [];
		existing.push(tx);
		groups.set(tx.date, existing);
	}
	return groups;
}

/** Get spending by category for a month */
export function getSpendingByCategory(txs: Transaction[], month: string): Map<string, number> {
	const result = new Map<string, number>();
	for (const tx of getTransactionsForMonth(txs, month)) {
		if (tx.type !== 'expense' || !tx.categoryId) continue;
		result.set(tx.categoryId, (result.get(tx.categoryId) ?? 0) + tx.amount);
	}
	return result;
}

/** Format currency */
export function formatCurrency(amount: number): string {
	return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

/** Format date label */
export function formatDateLabel(date: string): string {
	const today = todayStr();
	const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
	if (date === today) return 'Heute';
	if (date === yesterday) return 'Gestern';
	return new Date(date).toLocaleDateString('de-DE', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});
}
