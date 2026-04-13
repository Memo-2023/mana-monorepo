/**
 * Mail API client — communicates with the mana-mail service.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaMailUrl } from '$lib/api/config';
import type { ThreadSummary, ThreadDetail, MailboxInfo, MailAccount, EmailAddress } from './types';

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getValidToken();

	const response = await fetch(`${getManaMailUrl()}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

export const mailApi = {
	async getThreads(opts: { mailboxId?: string; limit?: number; offset?: number } = {}): Promise<{
		threads: ThreadSummary[];
		total: number;
	}> {
		const params = new URLSearchParams();
		if (opts.mailboxId) params.set('mailboxId', opts.mailboxId);
		if (opts.limit) params.set('limit', String(opts.limit));
		if (opts.offset) params.set('offset', String(opts.offset));
		return fetchWithAuth(`/api/v1/mail/threads?${params}`);
	},

	async getThread(threadId: string): Promise<ThreadDetail> {
		return fetchWithAuth(`/api/v1/mail/threads/${threadId}`);
	},

	async updateMessage(
		emailId: string,
		update: { isRead?: boolean; isFlagged?: boolean; mailboxIds?: Record<string, boolean> }
	): Promise<void> {
		await fetchWithAuth(`/api/v1/mail/messages/${emailId}`, {
			method: 'PUT',
			body: JSON.stringify(update),
		});
	},

	async sendEmail(email: {
		to: EmailAddress[];
		cc?: EmailAddress[];
		bcc?: EmailAddress[];
		subject: string;
		body: string;
		htmlBody?: string;
		inReplyTo?: string;
		references?: string[];
	}): Promise<{ emailId: string }> {
		return fetchWithAuth('/api/v1/mail/send', {
			method: 'POST',
			body: JSON.stringify(email),
		});
	},

	async getLabels(): Promise<MailboxInfo[]> {
		return fetchWithAuth('/api/v1/mail/labels');
	},

	async getAccounts(): Promise<MailAccount[]> {
		return fetchWithAuth('/api/v1/mail/accounts');
	},

	async updateAccount(
		accountId: string,
		update: { displayName?: string; signature?: string }
	): Promise<MailAccount> {
		return fetchWithAuth(`/api/v1/mail/accounts/${accountId}`, {
			method: 'PUT',
			body: JSON.stringify(update),
		});
	},
};
