import { transactionsApi } from '$lib/api';
import type {
	Transaction,
	CreateTransactionInput,
	UpdateTransactionInput,
	TransactionFilters,
} from '@finance/shared';

let transactions = $state<Transaction[]>([]);
let total = $state(0);
let isLoading = $state(false);
let error = $state<string | null>(null);
let filters = $state<TransactionFilters>({});

export const transactionsStore = {
	get transactions() {
		return transactions;
	},
	get total() {
		return total;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get filters() {
		return filters;
	},

	setFilters(newFilters: TransactionFilters) {
		filters = { ...filters, ...newFilters };
	},

	clearFilters() {
		filters = {};
	},

	async fetchTransactions(customFilters?: TransactionFilters) {
		isLoading = true;
		error = null;
		try {
			const result = await transactionsApi.getAll(customFilters ?? filters);
			transactions = result.data;
			total = result.total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch transactions';
		} finally {
			isLoading = false;
		}
	},

	async fetchRecent(limit = 10) {
		try {
			return await transactionsApi.getRecent(limit);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch recent transactions';
			throw e;
		}
	},

	async createTransaction(data: CreateTransactionInput) {
		isLoading = true;
		error = null;
		try {
			const newTransaction = await transactionsApi.create(data);
			transactions = [newTransaction, ...transactions];
			total += 1;
			return newTransaction;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create transaction';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async updateTransaction(id: string, data: UpdateTransactionInput) {
		isLoading = true;
		error = null;
		try {
			const updated = await transactionsApi.update(id, data);
			transactions = transactions.map((t) => (t.id === id ? updated : t));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update transaction';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async deleteTransaction(id: string) {
		isLoading = true;
		error = null;
		try {
			await transactionsApi.delete(id);
			transactions = transactions.filter((t) => t.id !== id);
			total -= 1;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete transaction';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	getTransactionById(id: string) {
		return transactions.find((t) => t.id === id);
	},
};
