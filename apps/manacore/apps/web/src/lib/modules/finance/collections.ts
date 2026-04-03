/**
 * Finance module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalTransaction, LocalFinanceCategory, LocalBudget } from './types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const transactionTable = db.table<LocalTransaction>('transactions');
export const categoryTable = db.table<LocalFinanceCategory>('financeCategories');
export const budgetTable = db.table<LocalBudget>('budgets');

// ─── Guest Seed ────────────────────────────────────────────

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

function daysAgoStr(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString().split('T')[0];
}

const SEED_CATEGORIES = [
	...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, id: `cat-exp-${i}` })),
	...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, id: `cat-inc-${i}` })),
];

export const FINANCE_GUEST_SEED = {
	financeCategories: SEED_CATEGORIES satisfies LocalFinanceCategory[],
	transactions: [
		{
			id: 'tx-1',
			type: 'expense' as const,
			amount: 12.5,
			categoryId: 'cat-exp-0',
			description: 'Mittagessen',
			date: todayStr(),
			note: null,
		},
		{
			id: 'tx-2',
			type: 'expense' as const,
			amount: 2.9,
			categoryId: 'cat-exp-0',
			description: 'Kaffee',
			date: todayStr(),
			note: null,
		},
		{
			id: 'tx-3',
			type: 'expense' as const,
			amount: 49.99,
			categoryId: 'cat-exp-6',
			description: 'Spotify + Netflix',
			date: daysAgoStr(2),
			note: null,
		},
		{
			id: 'tx-4',
			type: 'income' as const,
			amount: 3200,
			categoryId: 'cat-inc-0',
			description: 'Gehalt März',
			date: daysAgoStr(5),
			note: null,
		},
	] satisfies LocalTransaction[],
	budgets: [] satisfies LocalBudget[],
};
