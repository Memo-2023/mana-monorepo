/**
 * Finance Tools — LLM-accessible operations for income/expense tracking.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { financeStore } from './stores/finance.svelte';
import { transactionTable, categoryTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import { toTransaction, toCategory, currentMonth, formatCurrency } from './queries';
import type { LocalTransaction, LocalFinanceCategory, TransactionType } from './types';

export const financeTools: ModuleTool[] = [
	{
		name: 'add_transaction',
		module: 'finance',
		description: 'Erfasst eine Einnahme oder Ausgabe',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Art',
				required: true,
				enum: ['income', 'expense'],
			},
			{ name: 'amount', type: 'number', description: 'Betrag in Euro', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: true },
			{
				name: 'date',
				type: 'string',
				description: 'Datum (YYYY-MM-DD, Standard: heute)',
				required: false,
			},
		],
		async execute(params) {
			const tx = await financeStore.addTransaction({
				type: params.type as TransactionType,
				amount: params.amount as number,
				description: params.description as string,
				date: params.date as string | undefined,
			});
			return {
				success: true,
				data: tx,
				message: `${params.type === 'income' ? 'Einnahme' : 'Ausgabe'}: ${formatCurrency(params.amount as number)} (${params.description})`,
			};
		},
	},

	{
		name: 'get_month_summary',
		module: 'finance',
		description:
			'Gibt die Finanz-Zusammenfassung fuer einen Monat zurueck: Einnahmen, Ausgaben, Bilanz, Ausgaben pro Kategorie.',
		parameters: [
			{
				name: 'month',
				type: 'string',
				description: 'Monat im Format YYYY-MM (Standard: aktueller Monat)',
				required: false,
			},
		],
		async execute(params) {
			const month = (params.month as string) ?? currentMonth();

			const [allTxs, allCats] = await Promise.all([
				transactionTable.toArray(),
				categoryTable.toArray(),
			]);

			const visible = allTxs.filter((t) => !t.deletedAt);
			const decrypted = await decryptRecords<LocalTransaction>('transactions', visible);
			const txs = decrypted.map(toTransaction);
			const cats = allCats.filter((c) => !c.deletedAt).map(toCategory);

			const monthTxs = txs.filter((t) => t.date.startsWith(month));
			let income = 0;
			let expenses = 0;
			const byCategory = new Map<string, number>();

			for (const tx of monthTxs) {
				if (tx.type === 'income') income += tx.amount;
				else {
					expenses += tx.amount;
					if (tx.categoryId) {
						byCategory.set(tx.categoryId, (byCategory.get(tx.categoryId) ?? 0) + tx.amount);
					}
				}
			}

			const catBreakdown = [...byCategory.entries()]
				.sort((a, b) => b[1] - a[1])
				.map(([catId, amount]) => {
					const cat = cats.find((c) => c.id === catId);
					return { category: cat ? `${cat.emoji} ${cat.name}` : 'Sonstiges', amount };
				});

			return {
				success: true,
				data: {
					month,
					income,
					expenses,
					balance: income - expenses,
					transactions: monthTxs.length,
					byCategory: catBreakdown,
				},
				message: `${month}: ${formatCurrency(income)} Einnahmen, ${formatCurrency(expenses)} Ausgaben, Bilanz: ${formatCurrency(income - expenses)}`,
			};
		},
	},

	{
		name: 'list_transactions',
		module: 'finance',
		description:
			'Listet die letzten Transaktionen auf. Optional nach Typ (income/expense) und Monat filterbar.',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Nur income oder expense zeigen',
				required: false,
				enum: ['income', 'expense'],
			},
			{
				name: 'month',
				type: 'string',
				description: 'Monat im Format YYYY-MM',
				required: false,
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (Standard: 20)',
				required: false,
			},
		],
		async execute(params) {
			const filterType = params.type as TransactionType | undefined;
			const month = params.month as string | undefined;
			const limit = (params.limit as number) ?? 20;

			const all = await transactionTable.toArray();
			const visible = all.filter((t) => !t.deletedAt);
			const decrypted = await decryptRecords<LocalTransaction>('transactions', visible);
			let txs = decrypted.map(toTransaction);

			if (filterType) txs = txs.filter((t) => t.type === filterType);
			if (month) txs = txs.filter((t) => t.date.startsWith(month));

			txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
			const sliced = txs.slice(0, limit);

			return {
				success: true,
				data: sliced.map((t) => ({
					id: t.id,
					type: t.type,
					amount: t.amount,
					description: t.description,
					date: t.date,
				})),
				message: `${sliced.length} Transaktionen${filterType ? ` (${filterType})` : ''}${month ? ` in ${month}` : ''}`,
			};
		},
	},
];
