/**
 * Finance module types.
 *
 * Simple income/expense tracking with categories and monthly budgets.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Local Record Types (Dexie) ───────────────────────────

export type TransactionType = 'income' | 'expense';

export interface LocalTransaction extends BaseRecord {
	type: TransactionType;
	amount: number; // always positive, type determines sign
	categoryId: string | null;
	description: string;
	date: string; // YYYY-MM-DD
	note: string | null;
}

export interface LocalFinanceCategory extends BaseRecord {
	name: string;
	emoji: string;
	color: string;
	type: TransactionType;
	order: number;
}

export interface LocalBudget extends BaseRecord {
	categoryId: string;
	month: string; // YYYY-MM
	amount: number;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Transaction {
	id: string;
	type: TransactionType;
	amount: number;
	categoryId: string | null;
	description: string;
	date: string;
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface FinanceCategory {
	id: string;
	name: string;
	emoji: string;
	color: string;
	type: TransactionType;
	order: number;
	createdAt: string;
}

export interface Budget {
	id: string;
	categoryId: string;
	month: string;
	amount: number;
}

// ─── Constants ────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: Omit<LocalFinanceCategory, keyof BaseRecord>[] = [
	{ name: 'Essen', emoji: '\ud83c\udf54', color: '#f97316', type: 'expense', order: 0 },
	{ name: 'Transport', emoji: '\ud83d\ude8c', color: '#3b82f6', type: 'expense', order: 1 },
	{ name: 'Einkaufen', emoji: '\ud83d\udecd\ufe0f', color: '#ec4899', type: 'expense', order: 2 },
	{ name: 'Wohnung', emoji: '\ud83c\udfe0', color: '#8b5cf6', type: 'expense', order: 3 },
	{ name: 'Unterhaltung', emoji: '\ud83c\udfac', color: '#ef4444', type: 'expense', order: 4 },
	{ name: 'Gesundheit', emoji: '\ud83d\udc8a', color: '#22c55e', type: 'expense', order: 5 },
	{ name: 'Abos', emoji: '\ud83d\udd01', color: '#06b6d4', type: 'expense', order: 6 },
	{ name: 'Sonstiges', emoji: '\ud83d\udce6', color: '#6b7280', type: 'expense', order: 7 },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<LocalFinanceCategory, keyof BaseRecord>[] = [
	{ name: 'Gehalt', emoji: '\ud83d\udcb0', color: '#22c55e', type: 'income', order: 0 },
	{ name: 'Freelance', emoji: '\ud83d\udcbb', color: '#3b82f6', type: 'income', order: 1 },
	{ name: 'Sonstiges', emoji: '\ud83d\udcb8', color: '#6b7280', type: 'income', order: 2 },
];

export const CATEGORY_COLORS: string[] = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#84cc16',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#a855f7',
	'#d946ef',
	'#ec4899',
];
