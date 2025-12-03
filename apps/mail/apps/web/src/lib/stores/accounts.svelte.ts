/**
 * Accounts Store - Manages email accounts using Svelte 5 runes
 */

import { accountsApi, type EmailAccount } from '$lib/api/accounts';

let accounts = $state<EmailAccount[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedAccountId = $state<string | null>(null);

export const accountsStore = {
	get accounts() {
		return accounts;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedAccountId() {
		return selectedAccountId;
	},
	get selectedAccount() {
		return accounts.find((a) => a.id === selectedAccountId) || null;
	},
	get defaultAccount() {
		return accounts.find((a) => a.isDefault) || accounts[0] || null;
	},

	setSelectedAccount(id: string | null) {
		selectedAccountId = id;
	},

	async fetchAccounts() {
		loading = true;
		error = null;

		const result = await accountsApi.list();

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		accounts = result.data?.accounts || [];

		// Auto-select default or first account
		if (!selectedAccountId && accounts.length > 0) {
			const defaultAcc = accounts.find((a) => a.isDefault);
			selectedAccountId = defaultAcc?.id || accounts[0].id;
		}

		loading = false;
	},

	async createImapAccount(data: Parameters<typeof accountsApi.create>[0]) {
		loading = true;
		error = null;

		const result = await accountsApi.create(data);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return null;
		}

		if (result.data?.account) {
			accounts = [...accounts, result.data.account];
			if (accounts.length === 1) {
				selectedAccountId = result.data.account.id;
			}
		}

		loading = false;
		return result.data?.account || null;
	},

	async updateAccount(id: string, data: Parameters<typeof accountsApi.update>[1]) {
		const result = await accountsApi.update(id, data);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		if (result.data?.account) {
			accounts = accounts.map((a) => (a.id === id ? result.data!.account : a));
		}

		return result.data?.account || null;
	},

	async deleteAccount(id: string) {
		const result = await accountsApi.delete(id);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		accounts = accounts.filter((a) => a.id !== id);

		if (selectedAccountId === id) {
			selectedAccountId = accounts[0]?.id || null;
		}

		return true;
	},

	async setDefaultAccount(id: string) {
		const result = await accountsApi.setDefault(id);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		accounts = accounts.map((a) => ({
			...a,
			isDefault: a.id === id,
		}));

		return true;
	},

	async syncAccount(id: string) {
		const result = await accountsApi.sync(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		// Update lastSyncAt
		accounts = accounts.map((a) =>
			a.id === id ? { ...a, lastSyncAt: new Date().toISOString() } : a
		);

		return result.data;
	},

	async initGoogleOAuth() {
		const result = await accountsApi.initGoogleOAuth();
		if (result.data?.authUrl) {
			window.location.href = result.data.authUrl;
		}
		return result;
	},

	async initMicrosoftOAuth() {
		const result = await accountsApi.initMicrosoftOAuth();
		if (result.data?.authUrl) {
			window.location.href = result.data.authUrl;
		}
		return result;
	},

	// Aliases for settings page
	async addImapAccount(data: {
		name: string;
		email: string;
		imapHost: string;
		imapPort: number;
		smtpHost: string;
		smtpPort: number;
		password: string;
	}) {
		return this.createImapAccount(data);
	},

	async removeAccount(id: string) {
		return this.deleteAccount(id);
	},

	async testConnection(data: {
		imapHost: string;
		imapPort: number;
		smtpHost: string;
		smtpPort: number;
		email: string;
		password: string;
	}) {
		const result = await accountsApi.test({
			...data,
			name: 'Test',
		});

		if (result.error) {
			return { success: false, message: result.error.message };
		}

		return {
			success: result.data?.success || false,
			message: result.data?.success
				? 'Connection successful!'
				: result.data?.message || 'Connection failed',
		};
	},

	initiateGoogleOAuth() {
		return this.initGoogleOAuth();
	},

	initiateMicrosoftOAuth() {
		return this.initMicrosoftOAuth();
	},
};
