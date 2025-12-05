import { fetchApi } from './client';

export interface EmailAccount {
	id: string;
	userId: string;
	name: string;
	email: string;
	provider: 'gmail' | 'outlook' | 'imap';
	isDefault: boolean;
	syncEnabled: boolean;
	lastSyncAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateImapAccountDto {
	name: string;
	email: string;
	password: string;
	imapHost: string;
	imapPort: number;
	imapSecurity?: 'ssl' | 'starttls' | 'none';
	smtpHost: string;
	smtpPort: number;
	smtpSecurity?: 'ssl' | 'starttls' | 'none';
}

export interface UpdateAccountDto {
	name?: string;
	syncEnabled?: boolean;
}

export const accountsApi = {
	async list() {
		return fetchApi<{ accounts: EmailAccount[] }>('/accounts');
	},

	async get(id: string) {
		return fetchApi<{ account: EmailAccount }>(`/accounts/${id}`);
	},

	async create(data: CreateImapAccountDto) {
		return fetchApi<{ account: EmailAccount }>('/accounts', {
			method: 'POST',
			body: data,
		});
	},

	async update(id: string, data: UpdateAccountDto) {
		return fetchApi<{ account: EmailAccount }>(`/accounts/${id}`, {
			method: 'PATCH',
			body: data,
		});
	},

	async delete(id: string) {
		return fetchApi<{ success: boolean }>(`/accounts/${id}`, {
			method: 'DELETE',
		});
	},

	async setDefault(id: string) {
		return fetchApi<{ account: EmailAccount }>(`/accounts/${id}/default`, {
			method: 'POST',
		});
	},

	async testConnection(id: string) {
		return fetchApi<{ success: boolean; error?: string }>(`/accounts/${id}/test`, {
			method: 'POST',
		});
	},

	async test(data: CreateImapAccountDto) {
		return fetchApi<{ success: boolean; message?: string }>('/accounts/test', {
			method: 'POST',
			body: data,
		});
	},

	async sync(id: string) {
		return fetchApi<{ success: boolean; newEmails: number }>(`/sync/accounts/${id}`, {
			method: 'POST',
		});
	},

	// OAuth
	async initGoogleOAuth() {
		return fetchApi<{ authUrl: string }>('/oauth/google/init', {
			method: 'POST',
		});
	},

	async initMicrosoftOAuth() {
		return fetchApi<{ authUrl: string }>('/oauth/microsoft/init', {
			method: 'POST',
		});
	},
};
