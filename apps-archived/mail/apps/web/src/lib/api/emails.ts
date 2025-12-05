import { fetchApi } from './client';

export interface EmailAddress {
	email: string;
	name?: string;
}

export interface Email {
	id: string;
	accountId: string;
	folderId: string | null;
	userId: string;
	threadId: string | null;
	messageId: string;
	externalId: string | null;
	subject: string | null;
	fromAddress: string | null;
	fromName: string | null;
	toAddresses: EmailAddress[];
	ccAddresses: EmailAddress[] | null;
	snippet: string | null;
	bodyPlain: string | null;
	bodyHtml: string | null;
	sentAt: string | null;
	receivedAt: string | null;
	isRead: boolean;
	isStarred: boolean;
	isDraft: boolean;
	hasAttachments: boolean;
	aiSummary: string | null;
	aiCategory: string | null;
	aiPriority: string | null;
	aiSuggestedReplies: { text: string; tone: string }[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface EmailFilters {
	accountId?: string;
	folderId?: string;
	isRead?: boolean;
	isStarred?: boolean;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface UpdateEmailDto {
	isRead?: boolean;
	isStarred?: boolean;
	folderId?: string;
}

export interface BatchOperation {
	operation: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'move' | 'delete';
	emailIds: string[];
	targetFolderId?: string;
}

export const emailsApi = {
	async list(filters: EmailFilters = {}) {
		const params = new URLSearchParams();
		if (filters.accountId) params.set('accountId', filters.accountId);
		if (filters.folderId) params.set('folderId', filters.folderId);
		if (filters.isRead !== undefined) params.set('isRead', String(filters.isRead));
		if (filters.isStarred !== undefined) params.set('isStarred', String(filters.isStarred));
		if (filters.search) params.set('search', filters.search);
		if (filters.limit) params.set('limit', String(filters.limit));
		if (filters.offset) params.set('offset', String(filters.offset));

		const query = params.toString() ? `?${params.toString()}` : '';
		return fetchApi<{ emails: Email[]; total: number }>(`/emails${query}`);
	},

	async search(query: string, accountId?: string) {
		const params = new URLSearchParams({ q: query });
		if (accountId) params.set('accountId', accountId);
		return fetchApi<{ emails: Email[] }>(`/emails/search?${params.toString()}`);
	},

	async get(id: string) {
		return fetchApi<{ email: Email }>(`/emails/${id}`);
	},

	async getThread(id: string) {
		return fetchApi<{ emails: Email[] }>(`/emails/${id}/thread`);
	},

	async update(id: string, data: UpdateEmailDto) {
		return fetchApi<{ email: Email }>(`/emails/${id}`, {
			method: 'PATCH',
			body: data,
		});
	},

	async delete(id: string) {
		return fetchApi<{ success: boolean }>(`/emails/${id}`, {
			method: 'DELETE',
		});
	},

	async move(id: string, targetFolderId: string) {
		return fetchApi<{ email: Email }>(`/emails/${id}/move`, {
			method: 'POST',
			body: { targetFolderId },
		});
	},

	async batch(operation: BatchOperation) {
		return fetchApi<{ affected: number }>('/emails/batch', {
			method: 'POST',
			body: operation,
		});
	},

	// AI Features
	async summarize(id: string) {
		return fetchApi<{ summary: string; keyPoints?: string[] }>(`/emails/${id}/summarize`, {
			method: 'POST',
		});
	},

	async suggestReplies(id: string) {
		return fetchApi<{ replies: { text: string; tone: string }[] }>(
			`/emails/${id}/suggest-replies`,
			{
				method: 'POST',
			}
		);
	},

	async categorize(id: string) {
		return fetchApi<{ category: string; confidence: number; priority: string }>(
			`/emails/${id}/categorize`,
			{
				method: 'POST',
			}
		);
	},
};
