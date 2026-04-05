/**
 * Finance Store — Mutation-Only Service
 */

import { transactionTable, categoryTable } from '../collections';
import { toTransaction, toCategory } from '../queries';
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

		await transactionTable.add(newLocal);
		return toTransaction(newLocal);
	},

	async updateTransaction(
		id: string,
		data: Partial<
			Pick<LocalTransaction, 'type' | 'amount' | 'categoryId' | 'description' | 'date' | 'note'>
		>
	) {
		await transactionTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteTransaction(id: string) {
		await transactionTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
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
