import { accountsApi } from '$lib/api';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@finance/shared';

let accounts = $state<Account[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const accountsStore = {
	get accounts() {
		return accounts;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	get activeAccounts() {
		return accounts.filter((a) => !a.isArchived);
	},

	get totalByCurrency() {
		const totals: Record<string, number> = {};
		for (const account of accounts.filter((a) => !a.isArchived && a.includeInTotal)) {
			const balance = parseFloat(account.balance);
			const adjustedBalance =
				account.type === 'credit_card' || account.type === 'loan' ? -Math.abs(balance) : balance;
			totals[account.currency] = (totals[account.currency] || 0) + adjustedBalance;
		}
		return totals;
	},

	async fetchAccounts() {
		isLoading = true;
		error = null;
		try {
			accounts = await accountsApi.getAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch accounts';
		} finally {
			isLoading = false;
		}
	},

	async createAccount(data: CreateAccountInput) {
		isLoading = true;
		error = null;
		try {
			const newAccount = await accountsApi.create(data);
			accounts = [...accounts, newAccount];
			return newAccount;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create account';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async updateAccount(id: string, data: UpdateAccountInput) {
		isLoading = true;
		error = null;
		try {
			const updated = await accountsApi.update(id, data);
			accounts = accounts.map((a) => (a.id === id ? updated : a));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update account';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async deleteAccount(id: string) {
		isLoading = true;
		error = null;
		try {
			await accountsApi.delete(id);
			accounts = accounts.filter((a) => a.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete account';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async archiveAccount(id: string) {
		try {
			const updated = await accountsApi.archive(id);
			accounts = accounts.map((a) => (a.id === id ? updated : a));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to archive account';
			throw e;
		}
	},

	async unarchiveAccount(id: string) {
		try {
			const updated = await accountsApi.unarchive(id);
			accounts = accounts.map((a) => (a.id === id ? updated : a));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to unarchive account';
			throw e;
		}
	},

	getAccountById(id: string) {
		return accounts.find((a) => a.id === id);
	},
};
